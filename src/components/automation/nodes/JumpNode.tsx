import { Handle, Position, useReactFlow } from '@xyflow/react';
import { ArrowRightCircle, X } from 'lucide-react';

export default function JumpNode({ id, data, isConnectable }: any) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <>
      <div className="w-64 bg-white rounded-xl shadow-card border-2 border-teal-200 overflow-hidden group hover:border-teal-400 transition-colors relative">
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Apagar Nó"
        >
          <X size={14} strokeWidth={3} />
        </button>
        <div className="bg-teal-50 p-3 border-b border-teal-100 flex items-center gap-2">
          <div className="bg-teal-500 text-white p-1.5 rounded-lg shadow-sm">
            <ArrowRightCircle size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-teal-900">Ir para Fluxo</h3>
            <p className="text-[10px] text-teal-600/80 leading-none mt-0.5">Jump to Flow</p>
          </div>
        </div>
        <div className="p-4 bg-white">
          <span className="text-xs text-slate-500 block mb-1">Destino:</span>
          <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 truncate">
            {data.flowName || 'Seleccionar Fluxo...'}
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-teal-400 border-2 border-white rounded-full left-[-7px]" />
    </>
  );
}
