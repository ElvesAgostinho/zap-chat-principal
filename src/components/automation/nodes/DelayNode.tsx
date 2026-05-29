import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Clock, X } from 'lucide-react';

export default function DelayNode({ id, data }: { id: string, data: any }) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };
  return (
    <>
      <div className="w-48 shadow-soft rounded-xl bg-white border border-slate-200 overflow-hidden group hover:border-slate-400 transition-colors relative">
      <button 
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Apagar Nó"
      >
        <X size={14} strokeWidth={3} />
      </button>
      <div className="bg-slate-50 px-4 py-2 flex items-center gap-2 border-b border-slate-100">
        <div className="p-1.5 bg-slate-500 rounded-md text-white">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Atraso Inteligente</span>
      </div>
      
      <div className="p-4 bg-white flex flex-col items-center justify-center">
        <p className="text-sm font-bold text-slate-700">{data.label || 'Esperar 15 Minutos'}</p>
      </div>

      </div>
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-slate-200 border-2 border-white rounded-full left-[-7px]"
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-slate-500 border-2 border-white rounded-full right-[-7px]"
      />
    </>
  );
}
