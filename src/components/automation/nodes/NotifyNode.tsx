import { Handle, Position, useReactFlow } from '@xyflow/react';
import { BellRing, X } from 'lucide-react';

export default function NotifyNode({ id, data, isConnectable }: any) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <>
      <div className="w-64 bg-white rounded-xl shadow-card border-2 border-rose-200 overflow-hidden group hover:border-rose-400 transition-colors relative">
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Apagar Nó"
        >
          <X size={14} strokeWidth={3} />
        </button>
        <div className="bg-rose-50 p-3 border-b border-rose-100 flex items-center gap-2">
          <div className="bg-rose-500 text-white p-1.5 rounded-lg shadow-sm">
            <BellRing size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-rose-900">Notificação</h3>
            <p className="text-[10px] text-rose-600/80 leading-none mt-0.5">Alertar Equipa</p>
          </div>
        </div>
        <div className="p-4 bg-white">
          <div className="text-sm text-slate-600 break-words leading-relaxed italic border-l-2 border-rose-300 pl-3">
            {data.label || 'Lead precisa de ajuda humana!'}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-rose-400 border-2 border-white rounded-full left-[-7px]" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-rose-400 border-2 border-white rounded-full right-[-7px]" />
    </>
  );
}
