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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} 
        className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group flex flex-col gap-4 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${isCliente ? 'bg-primary/20 border-primary/30 text-primary shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
            {lead.foto_url ? (
              <img src={lead.foto_url} alt={lead.nome} className="w-full h-full object-cover rounded-lg" />
            ) : (
                <Icon className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight">{lead.nome}</h3>
            <p className="text-xs text-slate-500 font-medium">{lead.telefone || 'Sem contacto'}</p>
          </div>
        </div>
        <div className="text-right">
            <span className="text-[10px] text-slate-600 font-bold tabular-nums block mb-1">{formatDate(lead.criado_em)}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${
                lead.status === 'comprado' ? 'bg-primary/10 text-primary' : 
                lead.status === 'perdido' ? 'bg-red-500/10 text-red-400' :
                'bg-slate-800 text-slate-500'
            }`}>
                {lead.status}
            </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 uppercase tracking-wider">
                <MessageCircle className="w-3 h-3 text-primary" /> {sourceLabel[lead.fonte] || lead.fonte}
            </span>
            {lead.precisa_humano && (
                <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider">
                    ⚠️ Atenção IA
                </span>
            )}
        </div>
        {lead.interesse && <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">Interesse: {lead.interesse}</p>}
      </div>
    </motion.div>
  );
}
