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
    <motion.div 
      initial={{ opacity: 0, y: 8 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-card p-5 rounded-2xl border border-border/50 hover:border-border transition-all group flex flex-col gap-4 shadow-card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${isCliente ? 'bg-primary/20 border-primary/30 text-primary shadow-glow' : 'bg-secondary border-border text-muted-foreground'}`}>
            {lead.foto_url ? (
              <img src={lead.foto_url} alt={lead.nome} className="w-full h-full object-cover rounded-lg" />
            ) : (
                <Icon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm tracking-tight">{lead.nome}</h3>
            <p className="text-xs text-muted-foreground font-medium">{lead.telefone || 'Sem contacto'}</p>
          </div>
        </div>
        <div className="text-right">
            <span className="text-[10px] text-muted-foreground font-bold tabular-nums block mb-1">{formatDate(lead.criado_em)}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                lead.status === 'comprado' ? 'bg-primary/10 text-primary' : 
                lead.status === 'perdido' ? 'bg-destructive/10 text-destructive' :
                'bg-secondary text-muted-foreground'
            }`}>
                {lead.status}
            </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border uppercase tracking-wider">
                <MessageCircle className="w-3 h-3 text-primary" /> {sourceLabel[lead.fonte] || lead.fonte}
            </span>
            {lead.precisa_humano && (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider">
                    ⚠️ Atenção IA
                </span>
            )}
        </div>
        {lead.interesse && <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">Interesse: {lead.interesse}</p>}
      </div>
    </motion.div>
  );
}
