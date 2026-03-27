import { motion } from 'framer-motion';
import { Venda } from '@/types';
import { formatCurrency, formatTime, deliveryStatusLabels, paymentStatusLabels } from '@/data/mock';
import { Truck, CreditCard, MessageSquare, Package } from 'lucide-react';

const deliveryStatusColors: Record<string, string> = { pendente: 'bg-amber-100 text-amber-700', confirmado: 'bg-blue-100 text-blue-700', enviado: 'bg-emerald-100 text-emerald-700', entregue: 'bg-emerald-100 text-emerald-700' };
const paymentStatusColors: Record<string, string> = { pendente: 'bg-red-100 text-red-700', pago: 'bg-emerald-100 text-emerald-700' };

interface Props { venda: Venda; onOpenChat?: (leadId: string) => void; }

export default function OrderCardEnhanced({ venda, onOpenChat }: Props) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-card/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group shadow-card hover:shadow-glow relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex gap-4 items-center min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-secondary/50 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
            {venda.produto_imagem ? <img src={venda.produto_imagem} alt={venda.produto || ''} className="object-cover w-full h-full" /> : <Package className="w-7 h-7 text-muted-foreground/50" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground truncate text-base mb-1 font-display tracking-tight">{venda.cliente_nome || 'Cliente'}</h3>
            <p className="text-xs text-muted-foreground font-medium truncate uppercase tracking-widest opacity-80">
                {venda.produto} · <span className="text-primary font-black ml-1">{formatCurrency(venda.valor)}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-sm border ${
                venda.status === 'pendente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                venda.status === 'pago' ? 'bg-primary/20 text-primary border-primary/30 shadow-glow' : 
                'bg-slate-800/50 text-slate-400 border-white/5'
            }`}>
                {venda.status}
            </span>
            <time className="text-[10px] text-muted-foreground font-bold tabular-nums opacity-60 tracking-wider font-display">{formatTime(venda.criado_em)}</time>
        </div>
      </div>
      
      <div className="flex items-center gap-4 pt-4 border-t border-white/5 relative z-10">
        <div className="flex items-center gap-2 group/status px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.05]">
            <Truck className="w-3.5 h-3.5 text-muted-foreground group-hover/status:text-primary transition-colors" /> 
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover/status:text-foreground transition-colors">
                {deliveryStatusLabels[venda.status_entrega] || 'Pendente'}
            </span>
        </div>
        
        <div className="flex items-center gap-2 group/status px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 transition-colors hover:bg-white/[0.05]">
            <CreditCard className="w-3.5 h-3.5 text-muted-foreground group-hover/status:text-primary transition-colors" /> 
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground group-hover/status:text-foreground transition-colors">
                {paymentStatusLabels[venda.pagamento_status] || 'Pendente'}
            </span>
        </div>
        
        {onOpenChat && venda.lead_id && (
            <button 
                onClick={() => onOpenChat(venda.lead_id!)} 
                className="ml-auto w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 hover:bg-primary hover:text-black transition-all shadow-sm active:scale-95"
            >
                <MessageSquare className="w-5 h-5 fill-current" />
            </button>
        )}
      </div>
      
      {venda.observacoes && (
          <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 relative z-10 group-hover:border-white/10 transition-colors">
              <p className="text-[11px] text-muted-foreground font-medium flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shadow-glow" />
                  <span className="italic leading-relaxed">"{venda.observacoes}"</span>
              </p>
          </div>
      )}
    </motion.div>
  );
}
