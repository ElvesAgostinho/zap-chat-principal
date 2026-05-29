import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Shuffle, X } from 'lucide-react';

export default function RandomizerNode({ id, data, isConnectable }: any) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const splitA = data.splitA || 50;
  const splitB = 100 - splitA;

  return (
    <>
      <div className="w-56 bg-white rounded-xl shadow-card border-2 border-fuchsia-200 overflow-hidden group hover:border-fuchsia-400 transition-colors relative">
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Apagar Nó"
        >
          <X size={14} strokeWidth={3} />
        </button>
        <div className="bg-fuchsia-50 p-3 border-b border-fuchsia-100 flex items-center gap-2">
          <div className="bg-fuchsia-500 text-white p-1.5 rounded-lg shadow-sm">
            <Shuffle size={16} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-fuchsia-900">Teste A/B</h3>
            <p className="text-[10px] text-fuchsia-600/80 leading-none mt-0.5">Randomizador</p>
          </div>
        </div>
        <div className="p-4 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Caminho A</span>
            <span className="text-xs font-bold text-fuchsia-600">{splitA}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div className="bg-fuchsia-500 h-1.5 rounded-full transition-all" style={{ width: `${splitA}%` }}></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Caminho B</span>
            <span className="text-xs font-bold text-slate-500">{splitB}%</span>
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-fuchsia-400 border-2 border-white rounded-full left-[-7px]" />
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} className="w-3 h-3 bg-fuchsia-500 border-2 border-white rounded-full right-[-7px] top-[35%]" />
      <Handle type="source" position={Position.Right} id="b" isConnectable={isConnectable} className="w-3 h-3 bg-slate-400 border-2 border-white rounded-full right-[-7px] top-[65%]" />
    </>
  );
}
