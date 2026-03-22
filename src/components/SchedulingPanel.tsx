import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface Agendamento {
  id: string;
  loja_id: string;
  lead_id: string | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  servico: string | null;
  data_hora: string;
  duracao_min: number;
  status: string;
  notas: string | null;
  criado_em: string;
}

interface HorarioLoja {
  id: string;
  loja_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function SchedulingPanel() {
  const { storeId, role } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [horarios, setHorarios] = useState<HorarioLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ cliente_nome: '', cliente_telefone: '', servico: '', data_hora: '', duracao_min: 60, notas: '' });

  const fetchData = async () => {
    if (!storeId) return;
    setLoading(true);
    const [{ data: ag }, { data: hr }] = await Promise.all([
      (supabase as any).from('agendamentos').select('*').eq('loja_id', storeId).order('data_hora', { ascending: true }),
      (supabase as any).from('horarios_loja').select('*').eq('loja_id', storeId),
    ]);
    setAgendamentos(ag || []);
    setHorarios(hr || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [storeId]);

  // Realtime
  useEffect(() => {
    if (!storeId) return;
    const ch = supabase.channel('agendamentos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  const handleCreate = async () => {
    if (!storeId || !form.cliente_nome || !form.data_hora) { toast.error('Preencha nome e data/hora'); return; }
    // Check conflicts
    const startTime = new Date(form.data_hora);
    const endTime = new Date(startTime.getTime() + form.duracao_min * 60000);
    const conflict = agendamentos.find(a => {
      if (a.status === 'cancelado') return false;
      const aStart = new Date(a.data_hora);
      const aEnd = new Date(aStart.getTime() + a.duracao_min * 60000);
      return startTime < aEnd && endTime > aStart;
    });
    if (conflict) { toast.error(`Conflito com agendamento de ${conflict.cliente_nome}`); return; }

    await (supabase as any).from('agendamentos').insert({
      loja_id: storeId, cliente_nome: form.cliente_nome, cliente_telefone: form.cliente_telefone || null,
      servico: form.servico || null, data_hora: form.data_hora, duracao_min: form.duracao_min,
      notas: form.notas || null,
    });
    toast.success('Agendamento criado!');
    setForm({ cliente_nome: '', cliente_telefone: '', servico: '', data_hora: '', duracao_min: 60, notas: '' });
    setShowNew(false);
    fetchData();
  };

  const handleCancel = async (id: string) => {
    await (supabase as any).from('agendamentos').update({ status: 'cancelado' }).eq('id', id);
    toast.success('Agendamento cancelado');
    fetchData();
  };

  const handleComplete = async (id: string) => {
    await (supabase as any).from('agendamentos').update({ status: 'concluido' }).eq('id', id);
    toast.success('Agendamento concluído!');
    fetchData();
  };

  // Schedule config
  const saveHorario = async (dia: number, hora_inicio: string, hora_fim: string, ativo: boolean) => {
    if (!storeId) return;
    const existing = horarios.find(h => h.dia_semana === dia);
    if (existing) {
      await (supabase as any).from('horarios_loja').update({ hora_inicio, hora_fim, ativo }).eq('id', existing.id);
    } else {
      await (supabase as any).from('horarios_loja').insert({ loja_id: storeId, dia_semana: dia, hora_inicio, hora_fim, ativo });
    }
    fetchData();
    toast.success(`Horário de ${DIAS[dia]} salvo`);
  };

  // Date navigation
  const goDay = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const dateStr = selectedDate.toLocaleDateString('pt-AO', { weekday: 'long', day: '2-digit', month: 'long' });
  const dayAgendamentos = agendamentos.filter(a => {
    const d = new Date(a.data_hora);
    return d.toDateString() === selectedDate.toDateString() && a.status !== 'cancelado';
  }).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  const upcomingCount = agendamentos.filter(a => new Date(a.data_hora) >= new Date() && a.status === 'agendado').length;

  const statusColor: Record<string, string> = {
    agendado: 'bg-blue-100 text-blue-700',
    concluido: 'bg-primary/10 text-primary',
    cancelado: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground text-lg">Agendamentos</h2>
            <p className="text-xs text-muted-foreground">{upcomingCount} próximo(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          {role === 'admin' && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowConfig(!showConfig)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${showConfig ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
              <Clock className="w-3.5 h-3.5 inline mr-1" />Horários
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
            <Plus className="w-3.5 h-3.5" />Novo
          </motion.button>
        </div>
      </div>

      {/* Config horários */}
      <AnimatePresence>
        {showConfig && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl shadow-card p-4 space-y-3 overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground">Horários de Funcionamento</h3>
            {DIAS.map((dia, i) => {
              const h = horarios.find(hr => hr.dia_semana === i);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-16">{DIAS_CURTOS[i]}</span>
                  <Switch checked={h?.ativo !== false} onCheckedChange={(v) => saveHorario(i, h?.hora_inicio || '08:00', h?.hora_fim || '18:00', v)} />
                  <Input type="time" defaultValue={h?.hora_inicio || '08:00'} className="w-24 text-xs h-8"
                    onBlur={(e) => saveHorario(i, e.target.value, h?.hora_fim || '18:00', h?.ativo !== false)} />
                  <span className="text-xs text-muted-foreground">—</span>
                  <Input type="time" defaultValue={h?.hora_fim || '18:00'} className="w-24 text-xs h-8"
                    onBlur={(e) => saveHorario(i, h?.hora_inicio || '08:00', e.target.value, h?.ativo !== false)} />
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New appointment form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl shadow-card p-4 space-y-3 overflow-hidden">
            <h3 className="text-sm font-semibold text-foreground">Novo Agendamento</h3>
            <Input placeholder="Nome do cliente" value={form.cliente_nome} onChange={e => setForm(f => ({ ...f, cliente_nome: e.target.value }))} className="text-sm" />
            <Input placeholder="Telefone" value={form.cliente_telefone} onChange={e => setForm(f => ({ ...f, cliente_telefone: e.target.value }))} className="text-sm" />
            <Input placeholder="Serviço" value={form.servico} onChange={e => setForm(f => ({ ...f, servico: e.target.value }))} className="text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Data e Hora</label>
                <Input type="datetime-local" value={form.data_hora} onChange={e => setForm(f => ({ ...f, data_hora: e.target.value }))} className="text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Duração (min)</label>
                <Input type="number" value={form.duracao_min} onChange={e => setForm(f => ({ ...f, duracao_min: parseInt(e.target.value) || 60 }))} className="text-sm" />
              </div>
            </div>
            <Input placeholder="Notas (opcional)" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className="text-sm" />
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              Criar Agendamento
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date navigator */}
      <div className="flex items-center justify-between bg-card rounded-2xl p-3 shadow-card">
        <button onClick={() => goDay(-1)} className="p-1.5 rounded-lg bg-secondary"><ChevronLeft className="w-4 h-4" /></button>
        <p className="text-sm font-medium text-foreground capitalize">{dateStr}</p>
        <button onClick={() => goDay(1)} className="p-1.5 rounded-lg bg-secondary"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Appointments list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : dayAgendamentos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Nenhum agendamento para este dia
        </div>
      ) : (
        <div className="space-y-2">
          {dayAgendamentos.map(ag => (
            <motion.div key={ag.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 shadow-card space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{ag.cliente_nome}</h4>
                  {ag.servico && <p className="text-xs text-muted-foreground">{ag.servico}</p>}
                  {ag.cliente_telefone && <p className="text-[11px] text-muted-foreground">📱 {ag.cliente_telefone}</p>}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColor[ag.status] || 'bg-secondary text-muted-foreground'}`}>
                  {ag.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {new Date(ag.data_hora).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                <span>• {ag.duracao_min} min</span>
              </div>
              {ag.notas && <p className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">{ag.notas}</p>}
              {ag.status === 'agendado' && (
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleComplete(ag.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />Concluir
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCancel(ag.id)}
                    className="px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
                    <XCircle className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
