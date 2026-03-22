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
      className="bg-card p-4 rounded-xl shadow-card border border-border/50 space-y-3 hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center min-w-0">
          <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
            {venda.produto_imagem ? <img src={venda.produto_imagem} alt={venda.produto || ''} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-foreground truncate text-sm">{venda.cliente_nome || 'Cliente'}</h3>
            <p className="text-xs text-muted-foreground truncate">{venda.produto} {venda.quantidade > 1 ? `×${venda.quantidade}` : ''} • {formatCurrency(venda.valor)}</p>
            {venda.entregador && <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Truck className="w-3 h-3" /> {venda.entregador}</p>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${venda.status === 'pendente' ? 'bg-amber-100 text-amber-700' : venda.status === 'pago' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{venda.status}</span>
          <time className="text-[10px] text-muted-foreground tabular-nums">{formatTime(venda.criado_em)}</time>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${deliveryStatusColors[venda.status_entrega] || 'bg-secondary text-muted-foreground'}`}><Truck className="w-3 h-3" />{deliveryStatusLabels[venda.status_entrega] || venda.status_entrega}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${paymentStatusColors[venda.pagamento_status] || 'bg-secondary text-muted-foreground'}`}><CreditCard className="w-3 h-3" />{paymentStatusLabels[venda.pagamento_status] || venda.pagamento_status}</span>
        {onOpenChat && venda.lead_id && <button onClick={() => onOpenChat(venda.lead_id!)} className="ml-auto text-[hsl(var(--whatsapp-mid))] hover:text-[hsl(var(--whatsapp-dark))] transition-colors"><MessageSquare className="w-4 h-4" /></button>}
      </div>
      {venda.observacoes && <p className="text-[11px] text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">📝 {venda.observacoes}</p>}
    </motion.div>
  );
}
