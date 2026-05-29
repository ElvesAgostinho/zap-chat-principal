import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Image as ImageIcon, X } from 'lucide-react';

export default function MediaNode({ id, data }: { id: string, data: any }) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };
  return (
    <>
      <div className="w-64 shadow-soft rounded-xl bg-white border border-slate-200 overflow-hidden group hover:border-pink-400 transition-colors relative">
      <button 
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Apagar Nó"
      >
        <X size={14} strokeWidth={3} />
      </button>
      <div className="bg-pink-50 px-4 py-2 flex items-center gap-2 border-b border-pink-100">
        <div className="p-1.5 bg-pink-500 rounded-md text-white">
          <ImageIcon className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-pink-800 uppercase tracking-wider">Ficheiro / Media</span>
      </div>
      
      <div className="p-4 bg-white">
        {data.mediaUrl && data.mediaUrl.match(/\\.(jpeg|jpg|gif|png)$/i) ? (
          <img src={data.mediaUrl} alt="Media" className="w-full h-24 object-cover rounded-lg mb-2 border border-slate-200" />
        ) : (
          <div className="w-full h-24 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center mb-2">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <p className="text-[11px] font-medium text-slate-500 text-center truncate">{data.label || 'Nenhum ficheiro selecionado'}</p>
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
        className="w-3 h-3 bg-pink-500 border-2 border-white rounded-full right-[-7px]"
      />
    </>
  );
}
