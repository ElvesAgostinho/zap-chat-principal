import { Handle, Position, useReactFlow } from '@xyflow/react';
import { MessageCircle, X } from 'lucide-react';

export default function TriggerNode({ id, data }: { id: string, data: any }) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };
  return (
    <>
      <div className="w-64 shadow-elevated rounded-xl bg-white border-2 border-sky-500 overflow-hidden group hover:border-sky-400 transition-colors relative">
      
      <button 
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Apagar Nó"
      >
        <X size={14} strokeWidth={3} />
      </button>
      <div className="bg-sky-50 px-4 py-2 flex items-center gap-2 border-b border-sky-100">
        <div className="p-1.5 bg-sky-500 rounded-md text-white">
          <MessageCircle size={14} />
        </div>
        <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Gatilho Inicial</span>
      </div>
      <div className="p-4 bg-white">
        <p className="text-sm font-medium text-slate-700">{data.label}</p>
        <p className="text-xs text-slate-500 mt-1">Quando um cliente enviar esta mensagem, o fluxo começa.</p>
      </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-sky-500 border-2 border-white rounded-full right-[-7px]"
      />
    </>
  );
}
