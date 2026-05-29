import { useCallback, useRef, useState, DragEvent, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MessageSquare, Zap, GitBranch, Clock, Image as ImageIcon, CheckCircle, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Custom nodes
import TriggerNode from './nodes/TriggerNode';
import MessageNode from './nodes/MessageNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import MediaNode from './nodes/MediaNode';

const nodeTypes: NodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  actionNode: ActionNode,
  delayNode: DelayNode,
  conditionNode: ConditionNode,
  mediaNode: MediaNode,
};

const defaultNodes = [
  {
    id: '1',
    type: 'triggerNode',
    position: { x: 250, y: 100 },
    data: { label: 'Palavra-chave: "Comprar"' },
  }
];

let id = 0;
const getId = () => `dndnode_${id++}`;

function DnDPanel() {
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const menuItems = [
    { type: 'triggerNode', label: 'Gatilho', icon: Zap, color: 'text-sky-500', bg: 'bg-sky-50' },
    { type: 'messageNode', label: 'Mensagem', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'mediaNode', label: 'Media', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50' },
    { type: 'conditionNode', label: 'Condição', icon: GitBranch, color: 'text-amber-500', bg: 'bg-amber-50' },
    { type: 'delayNode', label: 'Atraso', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' },
    { type: 'actionNode', label: 'Acção', icon: CheckCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col shadow-sm z-10 overflow-y-auto shrink-0">
      <div className="mb-6 shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Blocos Disponíveis</h3>
        <p className="text-[10px] text-slate-500 mt-1">Arraste para a área de trabalho</p>
      </div>
      
      <div className="flex flex-col gap-3 pb-8">
        {menuItems.map((item) => (
          <div
            key={item.type}
            className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-grab hover:border-slate-300 hover:shadow-sm transition-all bg-white`}
            onDragStart={(event) => onDragStart(event, item.type, item.label)}
            draggable
          >
            <div className={`p-2 rounded-lg ${item.bg}`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <span className="text-xs font-semibold text-slate-700">{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function FlowArea({ nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange }: any) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedNode) return;
    
    setUploadingMedia(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `automations/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      
      updateNodeData('mediaUrl', urlData.publicUrl);
      updateNodeLabel(`Mídia: ${file.name}`);
      toast.success('Ficheiro carregado com sucesso!');
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao carregar ficheiro. Verifica o Storage (media).');
    } finally {
      setUploadingMedia(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds: any) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const defaultLabel = event.dataTransfer.getData('application/label');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      let label = defaultLabel;
      if (type === 'messageNode') label = 'Nova Mensagem';
      if (type === 'conditionNode') label = 'Se Contém Tag';
      if (type === 'actionNode') label = 'Adicionar Tag';

      const newNode = {
        id: getId(),
        type,
        position,
        data: { label },
      };

      setNodes((nds: any) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeLabel = (newLabel: string) => {
    if (!selectedNode) return;
    setNodes((nds: any) =>
      nds.map((n: any) => {
        if (n.id === selectedNode.id) {
          n.data = { ...n.data, label: newLabel };
        }
        return n;
      })
    );
    setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, label: newLabel } }));
  };

  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;
    setNodes((nds: any) =>
      nds.map((n: any) => {
        if (n.id === selectedNode.id) {
          n.data = { ...n.data, [key]: value };
        }
        return n;
      })
    );
    setSelectedNode((prev: any) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  return (
    <div className="flex-1 w-full h-full relative flex flex-row">
      <div className="flex-1 w-full h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          className="bg-slate-50"
        >
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'triggerNode': return '#0ea5e9';
                case 'messageNode': return '#3b82f6';
                case 'actionNode': return '#f97316';
                case 'conditionNode': return '#f59e0b';
                case 'mediaNode': return '#ec4899';
                default: return '#cbd5e1';
              }
            }} 
          />
          <Background gap={20} size={1} color="#e2e8f0" />
        </ReactFlow>
      </div>

      {/* Edit Panel (Rich) */}
      {selectedNode && (
        <aside className="w-80 bg-white border-l border-slate-200 p-5 flex flex-col shadow-xl z-20 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Editar Bloco</h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {selectedNode.id}</span>
          </div>

          <div className="space-y-4">
            
            {/* COMMON LABEL */}
            {selectedNode.type !== 'delayNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  {selectedNode.type === 'messageNode' ? 'Mensagem' : 'Conteúdo Principal'}
                </label>
                {selectedNode.type === 'messageNode' ? (
                  <textarea 
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                    value={selectedNode.data.label as string}
                    onChange={(e) => updateNodeLabel(e.target.value)}
                    placeholder="Escreve a tua mensagem aqui..."
                  />
                ) : (
                  <input 
                    type="text"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={selectedNode.data.label as string}
                    onChange={(e) => updateNodeLabel(e.target.value)}
                    placeholder="Escreve o texto ou configuração..."
                  />
                )}
              </div>
            )}

            {/* DELAY SPECIFIC */}
            {selectedNode.type === 'delayNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tempo de Espera</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    className="w-20 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={(selectedNode.data.amount as string) || '1'}
                    onChange={(e) => {
                      updateNodeData('amount', e.target.value);
                      updateNodeLabel(`Atraso: ${e.target.value} ${(selectedNode.data.unit as string) || 'min'}`);
                    }}
                  />
                  <select
                    className="flex-1 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={(selectedNode.data.unit as string) || 'min'}
                    onChange={(e) => {
                      updateNodeData('unit', e.target.value);
                      updateNodeLabel(`Atraso: ${(selectedNode.data.amount as string) || '1'} ${e.target.value}`);
                    }}
                  >
                    <option value="segundos">Segundos</option>
                    <option value="minutos">Minutos</option>
                    <option value="horas">Horas</option>
                    <option value="dias">Dias</option>
                  </select>
                </div>
              </div>
            )}

            {/* CONDITION SPECIFIC */}
            {selectedNode.type === 'conditionNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Condição Lógica</label>
                <select
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
                  value={(selectedNode.data.conditionType as string) || 'has_tag'}
                  onChange={(e) => updateNodeData('conditionType', e.target.value)}
                >
                  <option value="has_tag">Tem a Tag</option>
                  <option value="no_tag">Não tem a Tag</option>
                  <option value="phone_exists">Telefone Existe</option>
                </select>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={(selectedNode.data.conditionValue as string) || ''}
                  onChange={(e) => updateNodeData('conditionValue', e.target.value)}
                  placeholder="Ex: VIP"
                />
              </div>
            )}

            {/* MEDIA SPECIFIC */}
            {selectedNode.type === 'mediaNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Anexo</label>
                <input type="file" ref={fileRef} onChange={handleMediaUpload} className="hidden" accept="image/*,application/pdf" />
                <button 
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingMedia}
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-sky-500 hover:text-sky-500 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  {uploadingMedia ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                  <span className="text-xs font-semibold">
                    {uploadingMedia ? 'A carregar...' : 'Carregar Imagem / PDF'}
                  </span>
                </button>
                {selectedNode.data.mediaUrl && (
                  <p className="text-[10px] text-sky-600 mt-2 font-medium truncate">
                    Ficheiro atual: {selectedNode.data.mediaUrl as string}
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 italic">
                * As alterações são refletidas na tela imediatamente.
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedNode(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl mt-4 hover:bg-slate-200 transition-colors"
            >
              Fechar Painel
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

export default function WorkflowBuilder({ automationId, initialNodes, initialEdges }: { automationId: string, initialNodes?: any, initialEdges?: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes && initialNodes.length > 0 ? initialNodes : defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges && initialEdges.length > 0 ? initialEdges : []);
  const [isSaving, setIsSaving] = useState(false);

  const saveFlow = async () => {
    setIsSaving(true);
    try {
      // Extract trigger keyword from triggerNode if it exists
      const triggerNode = nodes.find(n => n.type === 'triggerNode');
      let triggerKeyword = '';
      if (triggerNode && triggerNode.data?.label) {
        // Assume label might be "Palavra-chave: comprar" or just "comprar"
        const label = String(triggerNode.data.label).toLowerCase();
        triggerKeyword = label.replace('palavra-chave:', '').trim();
      }

      await supabase.from('automacoes').update({
        nodes: nodes,
        edges: edges,
        trigger_keyword: triggerKeyword,
        atualizado_em: new Date().toISOString()
      }).eq('id', automationId);
      
      // Little delay for visual feedback
      setTimeout(() => setIsSaving(false), 800);
    } catch (err) {
      console.error('Save failed:', err);
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative">
      {/* Top Header/Toolbar */}
      <div className="absolute top-4 right-6 z-20 flex gap-2">
        <button 
          onClick={saveFlow}
          className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition-colors shadow-md"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'A Gravar...' : 'Gravar Flow'}
        </button>
      </div>
      
      <div className="flex-1 w-full h-full flex flex-row relative z-10">
        <ReactFlowProvider>
          <DnDPanel />
          <FlowArea 
            nodes={nodes} 
            edges={edges} 
            setNodes={setNodes} 
            setEdges={setEdges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
