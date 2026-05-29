import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, User, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PipelinePanelProps {
  leads: Lead[];
  onLeadsUpdated: () => void;
}

const COLUMNS = [
  { id: 'novo', title: 'Novos Leads', color: 'border-blue-500', bg: 'bg-blue-50' },
  { id: 'interessado', title: 'Interessados', color: 'border-amber-500', bg: 'bg-amber-50' },
  { id: 'aguardando', title: 'Em Negociação', color: 'border-purple-500', bg: 'bg-purple-50' },
  { id: 'vendido', title: 'Fechado (Ganho)', color: 'border-emerald-500', bg: 'bg-emerald-50' },
  { id: 'perdido', title: 'Perdido', color: 'border-rose-500', bg: 'bg-rose-50' },
];

export default function PipelinePanel({ leads, onLeadsUpdated }: PipelinePanelProps) {
  const { storeId } = useAuth();
  const [columns, setColumns] = useState<Record<string, Lead[]>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    // Group leads by status
    const grouped: Record<string, Lead[]> = {
      novo: [], interessado: [], aguardando: [], vendido: [], perdido: []
    };
    
    leads.forEach(lead => {
      // Normalize status to lowercase, fallback to 'novo' if unrecognized
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

    // Optimistic UI update
    const newColumns = { ...columns };
    const sourceList = Array.from(newColumns[sourceStatus]);
    const destList = Array.from(newColumns[destStatus]);
    
    const [movedLead] = sourceList.splice(source.index, 1);
    
    // Create new object to trigger re-render properly
    const updatedLead = { ...movedLead, status: destStatus };
    destList.splice(destination.index, 0, updatedLead);
    
    newColumns[sourceStatus] = sourceList;
    newColumns[destStatus] = destList;
    setColumns(newColumns);

    // Update database
    setUpdatingId(draggableId);
    try {
      // Map 'vendido' to 'comprado' in db if we want to keep consistency, but 'vendido' is fine.
      const statusToSave = destStatus === 'vendido' ? 'comprado' : destStatus;
      
      const { error } = await supabase
        .from('leads')
        .update({ status: statusToSave })
        .eq('id', draggableId)
        .eq('loja_id', storeId);

      if (error) throw error;
      onLeadsUpdated(); // Refresh global leads state
    } catch (error) {
      toast.error('Erro ao mover lead');
      // Revert optimism on error
      setColumns(columns);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] w-full overflow-x-auto pb-6">
      <div className="mb-6 px-2">
        <h2 className="text-2xl font-bold text-slate-800">Funil de Vendas</h2>
        <p className="text-slate-500 text-sm mt-1">Arraste os contactos para atualizar o estado do negócio.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 h-full px-2 items-start min-w-max">
          {COLUMNS.map(col => (
            <div key={col.id} className="w-[320px] flex flex-col h-full max-h-full">
              {/* Column Header */}
              <div className={`px-4 py-3 rounded-t-2xl border-t-4 ${col.color} ${col.bg} mb-3 flex items-center justify-between`}>
                <h3 className="font-bold text-slate-800 text-sm">{col.title}</h3>
                <span className="bg-white text-slate-600 text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                  {columns[col.id]?.length || 0}
                </span>
              </div>

              {/* Droppable Area */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto rounded-xl p-2 min-h-[150px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-slate-100 border-2 border-dashed border-slate-300' : 'bg-slate-50/50'
                    }`}
                  >
                    {columns[col.id]?.map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all group ${
                              snapshot.isDragging ? 'shadow-xl rotate-2 z-50 ring-2 ring-sky-500/50' : 'hover:border-sky-300 hover:shadow-md'
                            } ${updatingId === lead.id ? 'opacity-50' : ''}`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {lead.foto_url ? (
                                  <img src={lead.foto_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm truncate">{lead.nome}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  <p className="text-xs text-slate-500 font-medium">{lead.telefone || 'S/ Contato'}</p>
                                </div>
                              </div>
                            </div>
                            
                            {lead.interesse && (
                              <div className="mb-3 px-3 py-1.5 bg-slate-50 rounded-lg">
                                <p className="text-[11px] text-slate-600 line-clamp-2">
                                  <span className="font-semibold text-slate-700">Interesse:</span> {lead.interesse}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                                <MessageCircle className="w-3 h-3 text-sky-500" /> {lead.fonte || 'Direto'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(lead.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
