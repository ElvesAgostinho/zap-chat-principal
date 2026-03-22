import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, ChevronRight, Phone, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Lead } from '@/types';

interface PipelinePanelProps {
  leads: Lead[];
}

const STAGES = [
  { id: 'novo', label: 'Novo', color: 'bg-slate-500', bg: 'bg-slate-100 text-slate-700' },
  { id: 'interessado', label: 'Interessado', color: 'bg-blue-500', bg: 'bg-blue-100 text-blue-700' },
  { id: 'quase_compra', label: 'Quase Compra', color: 'bg-amber-500', bg: 'bg-amber-100 text-amber-700' },
  { id: 'cliente', label: 'Cliente', color: 'bg-emerald-500', bg: 'bg-emerald-100 text-emerald-700' },
];

export default function PipelinePanel({ leads }: PipelinePanelProps) {
  const navigate = useNavigate();
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Lead[]>();
    STAGES.forEach(s => map.set(s.id, []));
    leads.forEach(l => {
      const stage = STAGES.find(s => s.id === l.status) ? l.status : 'novo';
      map.get(stage)?.push(l);
    });
    return map;
  }, [leads]);

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAGES.map(stage => (
          <div key={stage.id} className="bg-card p-5 rounded-3xl border border-border/40 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{stage.label}</span>
            </div>
            <p className="text-2xl font-black text-foreground tabular-nums">{grouped.get(stage.id)?.length || 0}</p>
          </div>
        ))}
      </div>

      {/* Visual pipeline overview */}
      <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-secondary">
        {STAGES.map(stage => {
          const count = grouped.get(stage.id)?.length || 0;
          const pct = leads.length > 0 ? (count / leads.length) * 100 : 0;
          return (
            <motion.div key={stage.id} className={`${stage.color} h-full`}
              initial={{ width: 0 }} animate={{ width: `${Math.max(pct, 2)}%` }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-2 gap-2">
        {STAGES.map(stage => {
          const stageLeads = grouped.get(stage.id) || [];
          return (
            <motion.button key={stage.id} whileTap={{ scale: 0.97 }}
              onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              className={`p-3 rounded-2xl text-left transition-all ${expandedStage === stage.id ? 'ring-2 ring-primary shadow-elevated' : 'shadow-card'} bg-card`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <span className="text-xs font-medium text-foreground">{stage.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{stageLeads.length}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Expanded stage leads */}
      {expandedStage && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            {STAGES.find(s => s.id === expandedStage)?.label} — {grouped.get(expandedStage)?.length || 0}
          </h3>
          {(grouped.get(expandedStage) || []).slice(0, 20).map(lead => (
            <div key={lead.id} className="flex items-center gap-3 py-2 px-2 rounded-xl bg-secondary/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary overflow-hidden">
                {lead.foto_url ? (
                  <img src={lead.foto_url} alt={lead.nome} className="w-full h-full object-cover" />
                ) : (
                  lead.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{lead.nome}</p>
                <p className="text-[10px] text-muted-foreground">{lead.telefone || 'Sem telefone'}</p>
              </div>
              <button onClick={() => navigate(`/chat?lead=${lead.id}`)}
                className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {(grouped.get(expandedStage)?.length || 0) === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead nesta fase</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
