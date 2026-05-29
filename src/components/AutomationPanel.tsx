import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Automacao } from '@/types';
import { Bot, Plus, ArrowLeft, Play, Square, Trash2, Edit2 } from 'lucide-react';
import WorkflowBuilder from './automation/WorkflowBuilder';

export default function AutomationPanel() {
  const { storeId } = useAuth();
  const [automations, setAutomations] = useState<Automacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlow, setSelectedFlow] = useState<Automacao | null>(null);

  useEffect(() => {
    if (storeId) fetchAutomations();
  }, [storeId]);

  const fetchAutomations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automacoes')
      .select('*')
      .eq('loja_id', storeId)
      .order('criado_em', { ascending: false });
    
    if (!error && data) {
      setAutomations(data);
    }
    setLoading(false);
  };

  const createNewAutomation = async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from('automacoes')
      .insert([{ loja_id: storeId, nome: 'Nova Automação', ativo: false }])
      .select()
      .single();
    
    if (!error && data) {
      setAutomations([data, ...automations]);
      setSelectedFlow(data);
    }
  };

  const toggleStatus = async (e: React.MouseEvent, auto: Automacao) => {
    e.stopPropagation();
    const newStatus = !auto.ativo;
    await supabase.from('automacoes').update({ ativo: newStatus }).eq('id', auto.id);
    setAutomations(prev => prev.map(a => a.id === auto.id ? { ...a, ativo: newStatus } : a));
  };

  const deleteAutomation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Eliminar esta automação para sempre?')) return;
    await supabase.from('automacoes').delete().eq('id', id);
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  if (selectedFlow) {
    return (
      <div className="w-full h-[calc(100vh-80px)] rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-fade-in flex flex-col bg-white">
        <div className="h-14 border-b border-slate-200 flex items-center px-4 shrink-0 bg-slate-50 gap-4">
          <button 
            onClick={() => { setSelectedFlow(null); fetchAutomations(); }}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="font-bold text-slate-800">{selectedFlow.nome}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {selectedFlow.ativo ? '🟢 Activo' : '⚪ Inactivo'}
            </p>
          </div>
        </div>
        <div className="flex-1 w-full h-full relative">
          <WorkflowBuilder automationId={selectedFlow.id} initialNodes={selectedFlow.nodes} initialEdges={selectedFlow.edges} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fluxos de Automação</h2>
          <p className="text-slate-500 text-sm mt-1">Cria chatbots e sequências automatizadas estilo Manychat.</p>
        </div>
        <button 
          onClick={createNewAutomation}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-500 text-white text-sm font-bold shadow-md hover:bg-sky-600 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Fluxo
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center shadow-sm flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-sky-50 rounded-full flex items-center justify-center mb-6">
            <Bot className="w-10 h-10 text-sky-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Sem automações criadas</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Começa a automatizar o teu atendimento. Cria fluxos de boas vindas, respostas a palavras-chave ou carrinhos abandonados.
          </p>
          <button onClick={createNewAutomation} className="px-6 py-3 bg-sky-500 text-white rounded-xl font-bold shadow-md hover:bg-sky-600 transition-colors">
            Criar Primeiro Fluxo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {automations.map(auto => (
            <div 
              key={auto.id} 
              onClick={() => setSelectedFlow(auto)}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${auto.ativo ? 'bg-sky-500' : 'bg-slate-200'}`} />
              
              <div className="flex justify-between items-start mb-4 mt-2">
                <div className={`p-3 rounded-xl ${auto.ativo ? 'bg-sky-50 text-sky-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Bot className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => toggleStatus(e, auto)} className={`p-2 rounded-lg transition-colors ${auto.ativo ? 'bg-sky-50 text-sky-600 hover:bg-sky-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`} title={auto.ativo ? 'Desativar' : 'Activar'}>
                    {auto.ativo ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button onClick={(e) => deleteAutomation(e, auto.id)} className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors shadow-sm" title="Eliminar Automação">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-sky-600 transition-colors">
                {auto.nome}
              </h3>
              
              <div className="flex items-center gap-2 mt-auto pt-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${auto.ativo ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                  {auto.ativo ? 'A Correr' : 'Pausado'}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Editar Flow
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
