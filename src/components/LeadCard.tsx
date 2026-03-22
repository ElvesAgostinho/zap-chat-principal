import { motion } from 'framer-motion';
import { Lead } from '@/types';
import { formatDate } from '@/data/mock';
import { MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sourceLabel: Record<string, string> = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', website: 'Website', other: 'Outro' };
const statusColors: Record<string, string> = {
  novo: 'bg-blue-50 text-blue-700',
  interessado: 'bg-amber-50 text-amber-700',
  cliente: 'bg-emerald-50 text-emerald-700',
  comprado: 'bg-primary/10 text-primary',
  perdido: 'bg-destructive/10 text-destructive',
};

export default function LeadCard({ lead }: { lead: Lead }) {
  const isCliente = lead.status === 'cliente' || lead.status === 'comprado';
  const Icon = isCliente ? UserCheck : UserPlus;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-4 rounded-2xl shadow-card space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${isCliente ? 'bg-emerald-100' : 'bg-primary/10'}`}>
            {lead.foto_url ? (
              <img src={lead.foto_url} alt={lead.nome} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-primary">
                {lead.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{lead.nome}</h3>
            <p className="text-xs text-muted-foreground">{lead.telefone || 'Sem telefone'}</p>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground">{formatDate(lead.criado_em)}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant={isCliente ? 'default' : 'secondary'} className={isCliente ? 'bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5' : 'text-[10px] px-2 py-0.5'}>
          {isCliente ? '✅ Cliente' : '🔵 Lead'}
        </Badge>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{sourceLabel[lead.fonte] || lead.fonte}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[lead.status] || 'bg-secondary text-muted-foreground'}`}>{lead.status}</span>
        {lead.precisa_humano && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">⚠️ Atenção</span>}
      </div>
      {lead.interesse && <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Interesse:</span> {lead.interesse}</p>}
      {lead.notas && <p className="text-xs text-muted-foreground italic">"{lead.notas}"</p>}
    </motion.div>
  );
}
