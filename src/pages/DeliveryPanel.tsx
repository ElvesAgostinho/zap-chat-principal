import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, CreditCard, MessageSquare, Truck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Venda } from '@/types';
import { formatCurrency, formatTime, deliveryStatusLabels } from '@/data/mock';
import { Textarea } from '@/components/ui/textarea';
import AppHeader from '@/components/AppHeader';

export default function DeliveryPanel() {
  const navigate = useNavigate();
  const { storeId } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (!storeId) return;
    const fetch = async () => {
      const { data } = await (supabase as any).from('vendas').select('*').eq('loja_id', storeId).neq('status_entrega', 'entregue').order('criado_em', { ascending: false });
      setVendas(data || []);
      setLoading(false);
    };
    fetch();
  }, [storeId]);

  const updateVenda = async (id: string, patch: Partial<Venda>) => {
    await (supabase as any).from('vendas').update(patch).eq('id', id);
    setVendas(prev => prev.map(v => v.id === id ? { ...v, ...patch } as Venda : v));
  };

  const deliveryColors: Record<string, string> = { pendente: 'bg-amber-50 text-amber-700', confirmado: 'bg-blue-50 text-blue-700', enviado: 'bg-primary/10 text-primary', entregue: 'bg-primary/10 text-primary' };

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader
        rightContent={
          <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-white/15 text-white"><ArrowLeft className="w-4 h-4" /></button>
        }
      />
      <div className="max-w-lg mx-auto px-4 pt-4">
        <h2 className="text-metadata mb-4">Minhas Entregas</h2>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        : vendas.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card p-6 rounded-2xl shadow-card text-center">
            <Truck className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="text-foreground font-medium">Nenhuma entrega pendente</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {vendas.map(v => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-4 rounded-2xl shadow-card space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground">{v.cliente_nome || 'Cliente'}</h3>
                    <p className="text-sm text-muted-foreground">{v.produto} • {formatCurrency(v.valor)}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">📍 {v.cliente_endereco || 'Sem endereço'}</p>
                    <p className="text-[11px] text-muted-foreground">📱 {v.cliente_telefone || '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${deliveryColors[v.status_entrega]}`}>{deliveryStatusLabels[v.status_entrega]}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${v.pagamento_status === 'pago' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>{v.pagamento_status === 'pago' ? '💵 Pago' : '⏳ Pendente'}</span>
                  </div>
                </div>
                {notesId === v.id && (
                  <div className="space-y-2">
                    <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Observações..." className="text-sm" />
                    <div className="flex gap-2">
                      <button onClick={() => { updateVenda(v.id, { observacoes: noteText }); setNotesId(null); }} className="flex-1 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Salvar</button>
                      <button onClick={() => setNotesId(null)} className="px-3 py-2 rounded-xl bg-secondary text-foreground text-sm">Cancelar</button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateVenda(v.id, { status_entrega: 'entregue', status: 'entregue' })} disabled={v.status_entrega === 'entregue'} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"><Check className="w-4 h-4" /> Confirmar</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => updateVenda(v.id, { pagamento_status: 'pago' })} disabled={v.pagamento_status === 'pago'} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-card text-foreground text-sm font-medium border border-border disabled:opacity-40"><CreditCard className="w-4 h-4" /> Pagamento</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setNotesId(v.id); setNoteText(v.observacoes || ''); }} className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-card text-foreground text-sm font-medium border border-border"><MessageSquare className="w-4 h-4" /> Notas</motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
