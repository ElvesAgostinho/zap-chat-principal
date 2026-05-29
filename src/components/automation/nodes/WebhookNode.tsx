import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Webhook, X } from 'lucide-react';

export default function WebhookNode({ id, data, isConnectable }: any) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <>
      <div className="w-64 bg-white rounded-xl shadow-card border-2 border-purple-200 overflow-hidden group hover:border-purple-400 transition-colors relative">
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Apagar Nó"
        >
          <X size={14} strokeWidth={3} />
        </button>
        <div className="bg-purple-50 p-3 border-b border-purple-100 flex items-center gap-2">
          <div className="bg-purple-500 text-white p-1.5 rounded-lg shadow-sm">
            <Webhook size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-purple-900">Integração Webhook</h3>
            <p className="text-[10px] text-purple-600/80 leading-none mt-0.5">HTTP Request API</p>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${data.method === 'POST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {data.method || 'POST'}
            </span>
            <span className="text-xs text-slate-500 truncate font-mono">
              {data.url || 'https://api.exemplo.com/webhook'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
            <span className="text-green-600 font-bold">✓ Sucesso</span>
            <span className="text-rose-500 font-bold">✗ Erro</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-purple-400 border-2 border-white rounded-full left-[-7px]" />
      <Handle type="source" position={Position.Right} id="success" isConnectable={isConnectable} className="w-3 h-3 bg-green-500 border-2 border-white rounded-full right-[-7px] top-[35%]" />
      <Handle type="source" position={Position.Right} id="error" isConnectable={isConnectable} className="w-3 h-3 bg-rose-400 border-2 border-white rounded-full right-[-7px] top-[65%]" />
    </>
  );
}
