import { motion } from 'framer-motion';
import { Venda } from '@/types';
import { formatCurrency, formatTime, deliveryStatusLabels, paymentStatusLabels } from '@/data/mock';
import { Truck, CreditCard, MessageSquare, Package } from 'lucide-react';

const deliveryStatusColors: Record<string, string> = { pendente: 'bg-amber-100 text-amber-700', confirmado: 'bg-blue-100 text-blue-700', enviado: 'bg-emerald-100 text-emerald-700', entregue: 'bg-emerald-100 text-emerald-700' };
const paymentStatusColors: Record<string, string> = { pendente: 'bg-red-100 text-red-700', pago: 'bg-emerald-100 text-emerald-700' };

interface Props { venda: Venda; onOpenChat?: (leadId: string) => void; }

export default function OrderCardEnhanced({ venda, onOpenChat }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 items-center min-w-0">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {venda.produto_imagem ? <img src={venda.produto_imagem} alt={venda.produto || ''} className="object-cover w-full h-full" /> : <Package className="w-6 h-6 text-slate-700" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white truncate text-sm mb-0.5">{venda.cliente_nome || 'Cliente'}</h3>
            <p className="text-xs text-slate-400 font-medium truncate">{venda.produto} · <span className="text-primary font-bold">{formatCurrency(venda.valor)}</span></p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                venda.status === 'pendente' ? 'bg-amber-500/10 text-amber-500' : 
                venda.status === 'pago' ? 'bg-primary/10 text-primary' : 
                'bg-slate-800 text-slate-400'
            }`}>
                {venda.status}
            </span>
            <time className="text-[10px] text-slate-500 font-bold tabular-nums">{formatTime(venda.criado_em)}</time>
        </div>
      </div>
      
      <div className="flex items-center gap-3 pt-3 border-t border-white/5">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <Truck className="w-3.5 h-3.5" /> {deliveryStatusLabels[venda.status_entrega] || 'Pendente'}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <CreditCard className="w-3.5 h-3.5" /> {paymentStatusLabels[venda.pagamento_status] || 'Pendente'}
        </span>
        
        {onOpenChat && venda.lead_id && (
            <button 
                onClick={() => onOpenChat(venda.lead_id!)} 
                className="ml-auto w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-black transition-all"
            >
                <MessageSquare className="w-4 h-4" />
            </button>
        )}
      </div>
      
      {venda.observacoes && (
          <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[11px] text-slate-400 font-medium"><span className="text-primary mr-2">●</span>{venda.observacoes}</p>
          </div>
      )}
    </motion.div>
  );
}
