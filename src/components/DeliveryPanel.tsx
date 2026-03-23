import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, CreditCard, MessageSquare, Truck, Loader2, MapPin, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Venda } from '@/types';
import { formatCurrency, deliveryStatusLabels } from '@/data/mock';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';

export default function DeliveryPanel({ initialVendas }: { initialVendas: Venda[] }) {
  const { storeId } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>(initialVendas);
  const [loading, setLoading] = useState(false);
  const [notesId, setNotesId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    setVendas(initialVendas);
  }, [initialVendas]);

  const updateVenda = async (id: string, patch: Partial<Venda>) => {
    const { error } = await (supabase as any).from('vendas').update(patch).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar pedido');
      return;
    }
    setVendas(prev => prev.map(v => v.id === id ? { ...v, ...patch } as Venda : v));
    toast.success('Pedido atualizado');
  };

  const deliveryColors: Record<string, string> = { 
    pendente: 'bg-amber-50 text-amber-700 border-amber-200', 
    confirmado: 'bg-blue-50 text-blue-700 border-blue-200', 
    enviado: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
    entregue: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-display text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Gestão de Logística
          </h2>
          <p className="text-xs text-muted-foreground">Monitore e confirme suas entregas em tempo real</p>
        </div>
        <button 
          onClick={() => exportToCSV(vendas, 'logistica_entregas')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-secondary text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <Download className="w-4 h-4" /> Exportar Dados
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : vendas.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="bg-card p-12 rounded-3xl border border-dashed border-border/60 text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-bold">Nenhuma entrega pendente</p>
          <p className="text-xs text-muted-foreground mt-1">Todos os seus pedidos foram entregues ou estão em aberto.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendas.map(v => (
            <motion.div 
              key={v.id} 
              layout
              className="bg-card p-5 rounded-2xl shadow-card border border-border/50 space-y-4 hover:shadow-elevated transition-all"
            >
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {v.produto_imagem ? (
                    <img src={v.produto_imagem} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Truck className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-foreground truncate">{v.cliente_nome || 'Cliente'}</h3>
                    <span className="text-[10px] font-black tabular-nums">{formatCurrency(v.valor)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{v.produto} × {v.quantidade}</p>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                      <span className="leading-tight">{v.cliente_endereco || 'Endereço não informado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${deliveryColors[v.status_entrega]}`}>
                  {deliveryStatusLabels[v.status_entrega]}
                </span>
                <span className={`text-[9px] font-bold uppercase px-2.5 py-1 rounded-lg border ${v.pagamento_status === 'pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                  {v.pagamento_status === 'pago' ? '💵 Pago' : '⏳ Pendente'}
                </span>
              </div>

              {notesId === v.id ? (
                <div className="space-y-2 animate-in fade-in zoom-in-95">
                  <textarea 
                    value={noteText} 
                    onChange={e => setNoteText(e.target.value)} 
                    placeholder="Adicionar observação interna..." 
                    className="w-full p-3 rounded-xl bg-secondary text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => { updateVenda(v.id, { observacoes: noteText }); setNotesId(null); }} 
                      className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider"
                    >
                      Salvar
                    </button>
                    <button 
                      onClick={() => setNotesId(null)} 
                      className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-[11px] font-bold uppercase"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => updateVenda(v.id, { status_entrega: 'entregue', status: 'entregue' })} 
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold uppercase transition-all hover:shadow-glow active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" /> Entregue
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => updateVenda(v.id, { pagamento_status: 'pago' })} 
                      disabled={v.pagamento_status === 'pago'}
                      className="flex items-center justify-center h-10 rounded-xl bg-card text-foreground border border-border hover:bg-muted transition-all disabled:opacity-30"
                      title="Marcar como pago"
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => { setNotesId(v.id); setNoteText(v.observacoes || ''); }} 
                      className="flex items-center justify-center h-10 rounded-xl bg-card text-foreground border border-border hover:bg-muted transition-all"
                      title="Ver/Editar Notas"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {v.observacoes && notesId !== v.id && (
                <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                  <p className="text-[10px] text-amber-800 italic leading-relaxed">"{v.observacoes}"</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
