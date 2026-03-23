import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Play, Pause, Trash2, Clock, MessageSquare, Send, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Automation {
  id: string;
  nome: string;
  evento: string;
  atraso_dias: number;
  mensagem: string;
  is_active: boolean;
}

export default function AutomationPanel() {
  const { storeId } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [evento, setEvento] = useState('pos_venda');
  const [atraso, setAtraso] = useState('1');
  const [mensagem, setMensagem] = useState('');

  const fetchAutomations = async () => {
    if (!storeId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('campanhas_automaticas')
      .select('*')
      .eq('loja_id', storeId)
      .order('criado_em', { ascending: false });
    
    if (error) {
      toast.error('Erro ao carregar automações');
    } else {
      setAutomations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAutomations();
  }, [storeId]);

  const handleCreate = async () => {
    if (!nome || !mensagem || !storeId) return;

    const { error } = await (supabase as any)
      .from('campanhas_automaticas')
      .insert({
        loja_id: storeId,
        nome,
        evento,
        atraso_dias: parseInt(atraso),
        mensagem,
        is_active: true
      });

    if (error) {
      toast.error('Erro ao criar automação');
    } else {
      toast.success('Automação criada!');
      setShowAdd(false);
      setNome(''); setMensagem('');
      fetchAutomations();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await (supabase as any)
      .from('campanhas_automaticas')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) toast.error('Erro ao atualizar');
    else fetchAutomations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta automação?')) return;
    const { error } = await (supabase as any)
      .from('campanhas_automaticas')
      .delete()
      .eq('id', id);

    if (error) toast.error('Erro ao excluir');
    else fetchAutomations();
  };

  const eventLabels: Record<string, string> = {
    'pos_venda': 'Pós-Venda (Agradecimento)',
    'reativacao': 'Reativação (30 dias sem compra)',
    'abandono_carrinho': 'Recuperação de Carrinho',
    'boas_vindas': 'Boas-vindas (Novo Lead)'
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Automações de Marketing
          </h2>
          <p className="text-xs text-muted-foreground">Mensagens automáticas para engajar seus clientes</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-glow hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Automação
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card rounded-2xl p-5 border border-primary/20 shadow-elevated overflow-hidden"
          >
            <h3 className="text-sm font-bold mb-4">Configurar Nova Automação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Nome da Campanha</label>
                <input 
                  value={nome} 
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Agradecimento de Compra"
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Gatilho (Trigger)</label>
                <select 
                  value={evento}
                  onChange={e => setEvento(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                >
                  {Object.entries(eventLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Atraso (Dias)</label>
                <input 
                  type="number"
                  value={atraso} 
                  onChange={e => setAtraso(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="space-y-1.5 mb-6">
              <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Mensagem do WhatsApp</label>
              <textarea 
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Olá {{nome}}, obrigado por comprar conosco! Esperamos que goste do produto."
                className="w-full px-4 py-3 rounded-xl bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 h-32 resize-none"
              />
              <p className="text-[10px] text-muted-foreground px-1 italic">Use {"{{nome}}"} para personalizar com o nome do cliente.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCreate}
                className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-bold uppercase text-xs tracking-widest shadow-glow"
              >
                Ativar Automação
              </button>
              <button 
                onClick={() => setShowAdd(false)}
                className="px-6 py-3 rounded-xl bg-muted text-muted-foreground font-bold text-xs uppercase"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map(auto => (
          <motion.div 
            key={auto.id}
            layout
            className={`bg-card p-5 rounded-2xl border transition-all ${auto.is_active ? 'border-border/60' : 'border-dashed border-muted bg-muted/20 grayscale'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${auto.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{auto.nome}</h4>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Envia em {auto.atraso_dias} dia(s) após {auto.evento.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => toggleActive(auto.id, auto.is_active)}
                  className={`p-2 rounded-lg transition-colors ${auto.is_active ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'}`}
                >
                  {auto.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleDelete(auto.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-secondary/40 p-3 rounded-xl mb-4">
              <p className="text-xs text-muted-foreground italic line-clamp-2">"{auto.mensagem}"</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Enviados</p>
                  <p className="text-xs font-bold tabular-nums">124</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-muted-foreground uppercase font-bold mb-0.5">Retenção</p>
                  <p className="text-xs font-bold text-emerald-600">12%</p>
                </div>
              </div>
              <button className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                Ver Logs <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        ))}

        {!loading && automations.length === 0 && !showAdd && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border/60">
            <Zap className="w-8 h-8 mb-3 opacity-20" />
            <p className="text-sm font-medium">Nenhuma automação ativa</p>
            <p className="text-xs opacity-60">Crie sua primeira campanha para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
