import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Phone, MessageCircle, Euro, Tag, Clock, TrendingUp, CheckCircle2, XCircle, Edit3, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PipelinePanelProps {
  leads: Lead[];
  onLeadsUpdated: () => void;
}

const COLUMNS = [
  { id: 'novo',        title: 'Novos Leads',    color: 'border-blue-500',   bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   emoji: '🆕' },
  { id: 'interessado', title: 'Interessados',    color: 'border-amber-500',  bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  emoji: '⭐' },
  { id: 'aguardando',  title: 'Em Negociação',  color: 'border-purple-500', bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', emoji: '🔥' },
  { id: 'vendido',     title: 'Fechado (Ganho)', color: 'border-emerald-500',bg: 'bg-emerald-500',light: 'bg-emerald-50',text: 'text-emerald-700',emoji: '✅' },
  { id: 'perdido',     title: 'Perdido',         color: 'border-rose-500',   bg: 'bg-rose-500',   light: 'bg-rose-50',   text: 'text-rose-700',   emoji: '❌' },
];

// Tag colour palette (cycles)
const TAG_COLORS = [
  'bg-sky-100 text-sky-700 border-sky-200',
  'bg-violet-100 text-violet-700 border-violet-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  'bg-teal-100 text-teal-700 border-teal-200',
];

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) & 0xffff;
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
}

function formatEuro(val?: number | null) {
  if (!val) return null;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
}

// Inline value editor on the card
function DealValueBadge({ lead, onSave }: { lead: Lead; onSave: (id: string, val: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(lead.valor_estimado || ''));

  const commit = () => {
    const num = parseFloat(input.replace(',', '.'));
    if (!isNaN(num) && num >= 0) onSave(lead.id, num);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 mt-2" onClick={e => e.stopPropagation()}>
        <span className="text-xs text-slate-400">€</span>
        <input
          autoFocus
          type="number"
          min="0"
          className="w-20 text-xs border border-emerald-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        />
        <button onClick={commit} className="p-0.5 text-emerald-600 hover:text-emerald-700"><Check size={13} /></button>
        <button onClick={() => setEditing(false)} className="p-0.5 text-slate-400 hover:text-slate-600"><X size={13} /></button>
      </div>
    );
  }

  return (
    <button
      onClick={e => { e.stopPropagation(); setEditing(true); }}
      title="Clica para definir o valor do negócio"
      className={`mt-2 flex items-center gap-1 text-xs font-bold rounded-lg px-2 py-1 border transition-colors ${
        lead.valor_estimado
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
      }`}
    >
      <Euro size={11} />
      {lead.valor_estimado ? formatEuro(lead.valor_estimado) : 'Valor do negócio'}
      <Edit3 size={9} className="opacity-60 ml-0.5" />
    </button>
  );
}

// Lead Card
function LeadCard({ lead, index, updatingId, onSaveDealValue, onOpenChat }: {
  lead: Lead;
  index: number;
  updatingId: string | null;
  onSaveDealValue: (id: string, val: number) => void;
  onOpenChat: (lead: Lead) => void;
}) {
  const activityTs = lead.ultima_atividade || lead.criado_em;
  const isOld = activityTs && (Date.now() - new Date(activityTs).getTime()) > 3 * 24 * 60 * 60 * 1000;

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{ ...provided.draggableProps.style }}
          className={`mb-3 bg-white rounded-xl border transition-all group select-none ${
            snapshot.isDragging
              ? 'shadow-2xl rotate-1 ring-2 ring-sky-400/60 border-sky-300'
              : 'shadow-sm border-slate-200 hover:border-sky-300 hover:shadow-md'
          } ${updatingId === lead.id ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {/* Cold lead indicator */}
          {isOld && (
            <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 to-rose-400 rounded-t-xl" title="Lead sem actividade há 3+ dias" />
          )}

          <div className="p-4">
            {/* Avatar + name + phone */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-black shrink-0 overflow-hidden shadow-sm">
                {lead.foto_url
                  ? <img src={lead.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                  : (lead.nome || lead.telefone || '?').charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">{lead.nome || 'Sem nome'}</h4>
                {lead.telefone && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[11px] text-slate-500 font-medium">{lead.telefone}</span>
                  </div>
                )}
              </div>
              {/* Precisa humano indicator */}
              {lead.precisa_humano && (
                <div className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-pulse mt-1" title="Precisa de atendimento humano" />
              )}
            </div>

            {/* Deal value badge (inline editable) */}
            <DealValueBadge lead={lead} onSave={onSaveDealValue} />

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {lead.tags.slice(0, 4).map(tag => (
                  <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTagColor(tag)}`}>
                    {tag}
                  </span>
                ))}
                {lead.tags.length > 4 && (
                  <span className="text-[10px] text-slate-400 px-1">+{lead.tags.length - 4}</span>
                )}
              </div>
            )}

            {/* Interest snippet */}
            {lead.interesse && (
              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed bg-slate-50 rounded-lg px-2.5 py-1.5">
                {lead.interesse}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3 h-3 ${isOld ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-semibold ${isOld ? 'text-amber-600' : 'text-slate-400'}`}>
                {timeAgo(activityTs)}
              </span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onOpenChat(lead); }}
              className="flex items-center gap-1 text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 hover:border-sky-300 transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              Ver Conversa
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function PipelinePanel({ leads, onLeadsUpdated }: PipelinePanelProps) {
  const { storeId } = useAuth();
  const navigate = useNavigate();
  const [columns, setColumns] = useState<Record<string, Lead[]>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const totalLeads = leads.length;

  useEffect(() => {
    const grouped: Record<string, Lead[]> = {
      novo: [], interessado: [], aguardando: [], vendido: [], perdido: []
    };
    leads.forEach(lead => {
      let status = lead.status?.toLowerCase() || 'novo';
      if (status === 'comprado' || status === 'cliente') status = 'vendido';
      if (!grouped[status]) status = 'novo';
      grouped[status].push(lead);
    });
    setColumns(grouped);
  }, [leads]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    const newColumns = { ...columns };
    const sourceList = Array.from(newColumns[sourceStatus]);
    const destList = Array.from(newColumns[destStatus]);
    const [movedLead] = sourceList.splice(source.index, 1);
    const updatedLead = { ...movedLead, status: destStatus, ultima_atividade: new Date().toISOString() };
    destList.splice(destination.index, 0, updatedLead);
    newColumns[sourceStatus] = sourceList;
    newColumns[destStatus] = destList;
    setColumns(newColumns);

    setUpdatingId(draggableId);
    try {
      const statusToSave = destStatus === 'vendido' ? 'comprado' : destStatus;
      const { error } = await supabase
        .from('leads')
        .update({ status: statusToSave, ultima_atividade: new Date().toISOString() } as any)
        .eq('id', draggableId)
        .eq('loja_id', storeId);
      if (error) throw error;

      const colLabel = COLUMNS.find(c => c.id === destStatus)?.title || destStatus;
      toast.success(`Lead movido para "${colLabel}"`);
      onLeadsUpdated();
    } catch {
      toast.error('Erro ao mover lead');
      setColumns(columns);
    } finally {
      setUpdatingId(null);
    }
  };

  const saveDealValue = useCallback(async (leadId: string, val: number) => {
    setColumns(prev => {
      const next = { ...prev };
      for (const col of Object.keys(next)) {
        next[col] = next[col].map(l => l.id === leadId ? { ...l, valor_estimado: val } : l);
      }
      return next;
    });
    await supabase.from('leads').update({ valor_estimado: val } as any).eq('id', leadId);
    toast.success(`Valor guardado: ${formatEuro(val)}`);
    onLeadsUpdated();
  }, [storeId, onLeadsUpdated]);

  const openChat = useCallback((lead: Lead) => {
    navigate(`/chat?lead=${lead.id}`);
  }, [navigate]);

  // Stats
  const totalPipelineValue = Object.values(columns)
    .flat()
    .reduce((sum, l) => sum + (l.valor_estimado || 0), 0);

  const conversionRate = totalLeads > 0
    ? ((columns['vendido']?.length || 0) / totalLeads * 100).toFixed(1)
    : '0.0';

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Top Summary Bar */}
      <div className="flex items-center gap-6 mb-5 px-1 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Funil de Vendas</h2>
          <p className="text-slate-500 text-sm mt-0.5">Arraste os contactos para atualizar o estado do negócio.</p>
        </div>
        <div className="flex items-center gap-3 ml-auto flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Pipeline Total</p>
              <p className="text-sm font-black text-slate-800">{totalPipelineValue > 0 ? formatEuro(totalPipelineValue) : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Conversão</p>
              <p className="text-sm font-black text-slate-800">{conversionRate}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <User className="w-4 h-4 text-indigo-500" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Leads</p>
              <p className="text-sm font-black text-slate-800">{totalLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full items-start min-w-max">
            {COLUMNS.map(col => {
              const colLeads = columns[col.id] || [];
              const colValue = colLeads.reduce((sum, l) => sum + (l.valor_estimado || 0), 0);

              return (
                <div key={col.id} className="w-[300px] flex flex-col max-h-full">
                  {/* Column Header */}
                  <div className={`px-4 py-3 rounded-2xl ${col.light} border border-slate-200/60 mb-3 shadow-sm`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${col.bg}`} />
                        <h3 className={`font-bold text-sm ${col.text}`}>{col.title}</h3>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full ${col.bg} text-white shadow-sm`}>
                        {colLeads.length}
                      </span>
                    </div>
                    {/* Column value total */}
                    <div className={`text-[11px] font-bold ${col.text} opacity-70`}>
                      {colValue > 0 ? `${formatEuro(colValue)} em pipeline` : 'Sem valor definido'}
                    </div>
                  </div>

                  {/* Droppable */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 overflow-y-auto rounded-2xl p-2 min-h-[200px] transition-all duration-200 ${
                          snapshot.isDraggingOver
                            ? `border-2 border-dashed border-sky-400 bg-sky-50/60`
                            : 'border-2 border-dashed border-transparent bg-slate-50/30'
                        }`}
                      >
                        <AnimatePresence>
                          {colLeads.map((lead, index) => (
                            <motion.div
                              key={lead.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                            >
                              <LeadCard
                                lead={lead}
                                index={index}
                                updatingId={updatingId}
                                onSaveDealValue={saveDealValue}
                                onOpenChat={openChat}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {colLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex flex-col items-center justify-center h-24 opacity-40">
                            <div className="text-2xl mb-1">{col.emoji}</div>
                            <p className="text-xs text-slate-400">Arrasta aqui</p>
                          </div>
                        )}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
