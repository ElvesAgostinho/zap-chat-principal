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
import { MessageSquare, Zap, GitBranch, Clock, Image as ImageIcon, CheckCircle, Save, Loader2, Trash2, MessageCircle, Tag, HelpCircle, Webhook, Shuffle, ArrowRightCircle, BellRing } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const WhatsAppIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
import { toast } from 'sonner';

// Custom nodes
import TriggerNode from './nodes/TriggerNode';
import MessageNode from './nodes/MessageNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';
import ConditionNode from './nodes/ConditionNode';
import MediaNode from './nodes/MediaNode';
import InputNode from './nodes/InputNode';
import WebhookNode from './nodes/WebhookNode';
import RandomizerNode from './nodes/RandomizerNode';
import JumpNode from './nodes/JumpNode';
import NotifyNode from './nodes/NotifyNode';

const nodeTypes: NodeTypes = {
  triggerNode: TriggerNode,
  messageNode: MessageNode,
  actionNode: ActionNode,
  delayNode: DelayNode,
  conditionNode: ConditionNode,
  mediaNode: MediaNode,
  inputNode: InputNode,
  webhookNode: WebhookNode,
  randomizerNode: RandomizerNode,
  jumpNode: JumpNode,
  notifyNode: NotifyNode,
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
    { type: 'triggerNode', label: 'Gatilho Inicial', icon: WhatsAppIcon, color: 'text-[#25D366]', bg: 'bg-[#25D366]/10', desc: 'Inicia o fluxo com palavra-chave ou evento' },
    { type: 'messageNode', label: 'Mensagem', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', desc: 'Envia uma mensagem de texto simples' },
    { type: 'mediaNode', label: 'Media', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50', desc: 'Envia imagens, vídeos ou documentos (pdf)' },
    { type: 'inputNode', label: 'Pedir Input', icon: HelpCircle, color: 'text-indigo-500', bg: 'bg-indigo-50', desc: 'Guarda a resposta do cliente numa variável' },
    { type: 'conditionNode', label: 'Condição', icon: GitBranch, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Divide o fluxo (Sim ou Não)' },
    { type: 'randomizerNode', label: 'Teste A/B', icon: Shuffle, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', desc: 'Divide os leads aleatoriamente (50/50)' },
    { type: 'delayNode', label: 'Atraso', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50', desc: 'Pausa o envio por minutos/dias' },
    { type: 'actionNode', label: 'Acção CRM', icon: Tag, color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Adiciona etiquetas ou atualiza etapa' },
    { type: 'notifyNode', label: 'Notificar', icon: BellRing, color: 'text-rose-500', bg: 'bg-rose-50', desc: 'Alerta a tua equipa no painel' },
    { type: 'webhookNode', label: 'Webhook', icon: Webhook, color: 'text-purple-500', bg: 'bg-purple-50', desc: 'Envia dados para APIs externas ou Make' },
    { type: 'jumpNode', label: 'Ir para Fluxo', icon: ArrowRightCircle, color: 'text-teal-500', bg: 'bg-teal-50', desc: 'Ligar a outra automação' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col shadow-sm z-10 overflow-y-auto shrink-0">
      <div className="mb-6 shrink-0">
        <h3 className="font-bold text-slate-800 text-sm">Blocos Disponíveis</h3>
        <p className="text-[10px] text-slate-500 mt-1">Arraste para a área de trabalho</p>
      </div>
      
      <div className="flex flex-col gap-3 pb-24">
        {menuItems.map((item) => (
          <div
            key={item.type}
            className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-grab hover:border-slate-300 hover:shadow-sm transition-all bg-white`}
            onDragStart={(event) => onDragStart(event, item.type, item.label)}
            draggable
          >
            <div className={`p-2.5 rounded-lg ${item.bg} ${item.color} shadow-sm border border-white/50`}>
              <item.icon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-[13px]">{item.label}</span>
              <span className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</span>
            </div>
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
      if (type === 'conditionNode') label = 'Se Tem Etiqueta';
      if (type === 'actionNode') label = 'Adicionar Etiqueta';
      if (type === 'inputNode') label = 'Qual é o seu nome?';
      if (type === 'notifyNode') label = 'Lead quente precisa de atenção!';
      if (type === 'webhookNode') label = 'Webhook Request';
      if (type === 'randomizerNode') label = 'A/B Test';
      if (type === 'jumpNode') label = 'Saltar Fluxo';

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
          <Controls position="top-left" style={{ margin: '16px' }} />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'triggerNode': return '#0ea5e9';
                case 'messageNode': return '#3b82f6';
                case 'actionNode': return '#f97316';
                case 'conditionNode': return '#f59e0b';
                case 'mediaNode': return '#ec4899';
                case 'inputNode': return '#6366f1';
                case 'webhookNode': return '#a855f7';
                case 'randomizerNode': return '#d946ef';
                case 'jumpNode': return '#14b8a6';
                case 'notifyNode': return '#f43f5e';
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
            {!['delayNode', 'randomizerNode', 'webhookNode', 'jumpNode'].includes(selectedNode.type) && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  {selectedNode.type === 'messageNode' ? 'Mensagem' : 
                   selectedNode.type === 'inputNode' ? 'Pergunta a fazer' : 
                   selectedNode.type === 'actionNode' ? 'Etiqueta da Ação' :
                   selectedNode.type === 'notifyNode' ? 'Mensagem de Alerta' : 'Conteúdo Principal'}
                </label>
                {selectedNode.type === 'messageNode' || selectedNode.type === 'notifyNode' || selectedNode.type === 'inputNode' ? (
                  <textarea 
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                    value={selectedNode.data.label as string}
                    onChange={(e) => updateNodeLabel(e.target.value)}
                    placeholder="Escreve o texto aqui..."
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

            {/* INPUT SPECIFIC */}
            {selectedNode.type === 'inputNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Guardar resposta em</label>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                  value={(selectedNode.data.variable as string) || ''}
                  onChange={(e) => updateNodeData('variable', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="ex: email_cliente, nome_empresa"
                />
              </div>
            )}

            {/* WEBHOOK SPECIFIC */}
            {selectedNode.type === 'webhookNode' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Método HTTP</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    value={(selectedNode.data.method as string) || 'POST'}
                    onChange={(e) => updateNodeData('method', e.target.value)}
                  >
                    <option value="POST">POST (Enviar dados)</option>
                    <option value="GET">GET (Buscar dados)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Webhook URL</label>
                  <input 
                    type="url"
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                    value={(selectedNode.data.url as string) || ''}
                    onChange={(e) => updateNodeData('url', e.target.value)}
                    placeholder="https://sua-api.com/webhook"
                  />
                </div>
              </div>
            )}

            {/* RANDOMIZER SPECIFIC */}
            {selectedNode.type === 'randomizerNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Divisão de Tráfego (Caminho A)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="range"
                    min="1" max="99"
                    className="flex-1"
                    value={(selectedNode.data.splitA as number) || 50}
                    onChange={(e) => updateNodeData('splitA', Number(e.target.value))}
                  />
                  <span className="text-sm font-bold text-slate-700 w-12 text-right">{(selectedNode.data.splitA as number) || 50}%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  Caminho A: {(selectedNode.data.splitA as number) || 50}%<br/>
                  Caminho B: {100 - ((selectedNode.data.splitA as number) || 50)}%
                </p>
              </div>
            )}

            {/* JUMP SPECIFIC */}
            {selectedNode.type === 'jumpNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Fluxo de Destino</label>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={(selectedNode.data.flowName as string) || ''}
                  onChange={(e) => updateNodeData('flowName', e.target.value)}
                  placeholder="Nome exato do fluxo (ex: Boas Vindas)"
                />
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

            {/* ACTION SPECIFIC */}
            {selectedNode.type === 'actionNode' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tipo de Ação</label>
                <select
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
                  value={(selectedNode.data.actionType as string) || 'add_tag'}
                  onChange={(e) => {
                    updateNodeData('actionType', e.target.value);
                    const typeLabel = e.target.value === 'add_tag' ? 'Adicionar Etiqueta' : e.target.value === 'remove_tag' ? 'Remover Etiqueta' : 'Mudar Etapa do Cliente';
                    updateNodeLabel(`${typeLabel}: ${(selectedNode.data.actionValue as string) || ''}`);
                  }}
                >
                  <option value="add_tag">Adicionar Etiqueta</option>
                  <option value="remove_tag">Remover Etiqueta</option>
                  <option value="change_status">Mudar Etapa do Cliente</option>
                </select>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Qual o nome da etiqueta ou etapa?</label>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={(selectedNode.data.actionValue as string) || ''}
                  onChange={(e) => {
                    updateNodeData('actionValue', e.target.value);
                    const typeValue = (selectedNode.data.actionType as string) || 'add_tag';
                    const typeLabel = typeValue === 'add_tag' ? 'Adicionar Etiqueta' : typeValue === 'remove_tag' ? 'Remover Etiqueta' : 'Mudar Etapa';
                    updateNodeLabel(`${typeLabel}: ${e.target.value}`);
                  }}
                  placeholder="Ex: interessado, comprou_hoje"
                />
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
                  <option value="has_tag">Tem a Etiqueta</option>
                  <option value="no_tag">Não tem a Etiqueta</option>
                  <option value="phone_exists">Já guardámos o Telefone</option>
                  <option value="match_exact">A mensagem do cliente for igual a</option>
                  <option value="match_contains">A mensagem do cliente tiver a palavra</option>
                </select>
                <input 
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={(selectedNode.data.conditionValue as string) || ''}
                  onChange={(e) => updateNodeData('conditionValue', e.target.value)}
                  placeholder="Ex: VIP, ou '1', ou 'preço'"
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
            
            {selectedNode.type !== 'triggerNode' && (
              <button 
                onClick={() => {
                  setNodes((nds: any) => nds.filter((n: any) => n.id !== selectedNode.id));
                  setEdges((eds: any) => eds.filter((e: any) => e.source !== selectedNode.id && e.target !== selectedNode.id));
                  setSelectedNode(null);
                }}
                className="w-full py-2.5 bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl mt-4 hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Apagar Bloco
              </button>
            )}
            
            <button 
              onClick={() => setSelectedNode(null)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl mt-2 hover:bg-slate-200 transition-colors"
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
  const [showHelpModal, setShowHelpModal] = useState(false);

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
          onClick={() => setShowHelpModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm"
        >
          <HelpCircle className="w-4 h-4 text-sky-500" />
          Ajuda
        </button>
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

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="text-sky-500" />
                Guia das Automações
              </h2>
              <button onClick={() => setShowHelpModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6 text-slate-600 text-sm">
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Zap className="text-amber-500 w-4 h-4" /> 1. Gatilho (O Início)</h3>
                <p>Todas as automações começam com um Gatilho. Aqui defines qual é a <strong>palavra-chave</strong> que o cliente tem de escrever no WhatsApp para que este fluxo comece (ex: "oi", "preço").</p>
                <p className="text-slate-500 italic text-[13px]"><strong>Quando usar:</strong> É obrigatório ser o primeiro nó de qualquer fluxo. Usa para captar a primeira mensagem do cliente ou para criar atalhos (ex: cliente digita "suporte" para abrir um fluxo de ajuda).</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><MessageSquare className="text-sky-500 w-4 h-4" /> 2. Nova Mensagem</h3>
                <p>Envia um texto simples ao cliente. Podes usar a variável <code>{'{'}{'{'}nome{'}'}{'}'}</code> para chamar o cliente pelo nome. Podes encadear várias mensagens de seguida.</p>
                <p className="text-slate-500 italic text-[13px]"><strong>Quando usar:</strong> Para dar as boas-vindas, enviar menus de opções ("Digita 1 para X, 2 para Y"), responder a perguntas frequentes ou confirmar recebimentos.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><ImageIcon className="text-indigo-500 w-4 h-4" /> 3. Mídia (Imagens / Áudio)</h3>
                <p>Faz o upload de uma imagem, PDF ou vídeo. Se carregares um áudio <code>.ogg</code>, ele será enviado como "Áudio Gravado na Hora" no WhatsApp do cliente.</p>
                <p className="text-slate-500 italic text-[13px]"><strong>Quando usar:</strong> Para enviar o catálogo em PDF, fotos de produtos, comprovativos, ou um áudio natural (como se fosses tu a gravar na hora) para criar proximidade.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Tag className="text-amber-500 w-4 h-4" /> 4. Acção CRM (Etiquetas e Etapas)</h3>
                <p>Nó invisível para o cliente, mas essencial para a tua organização. Usa-o para:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Adicionar Etiqueta:</strong> Marca o cliente com uma palavra (ex: VIP, Interessado).</li>
                  <li><strong>Remover Etiqueta:</strong> Tira uma etiqueta antiga.</li>
                  <li><strong>Mudar Etapa do Cliente:</strong> Move o contacto automaticamente no teu quadro Kanban (Pipeline).</li>
                </ul>
                <p className="text-slate-500 italic text-[13px] mt-1"><strong>Quando usar:</strong> Sempre que quiseres qualificar um cliente automaticamente sem tocar no rato. Ex: Se ele pedir preço, move-o para a etapa "Negociação" e dá a etiqueta "Quente".</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><GitBranch className="text-amber-500 w-4 h-4" /> 5. Condição (Bifurcações)</h3>
                <p>Manda a conversa para caminhos diferentes! Exemplo: "Se a mensagem do cliente for igual a 1, vai para o caminho SIM (cima). Se não for, vai para o caminho NÃO (baixo)".</p>
                <p className="text-slate-500 italic text-[13px]"><strong>Quando usar:</strong> Quando das opções ao cliente (Ex: "1 - Comprar", "2 - Ajuda"). Colocas uma condição "Se a mensagem for igual a 1" e crias caminhos separados para cada resposta.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><Clock className="text-slate-500 w-4 h-4" /> 6. Atraso (Follow-up Mágico)</h3>
                <p>Coloca o fluxo em pausa. Podes definir para esperar 2 horas, e de seguida ligas a uma mensagem do tipo: <em>"Ainda tens interesse?"</em>. Excelente para recuperar clientes que pararam de responder.</p>
                <p className="text-slate-500 italic text-[13px]"><strong>Quando usar:</strong> Para lembrar o cliente que abandonou a conversa ou para simular que foste "verificar o stock" e voltaste passado 2 minutos com a resposta, parecendo mais humano.</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowHelpModal(false)} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
