import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Shuffle } from 'lucide-react';

const RandomizerNode = memo(({ data, isConnectable }: any) => {
  return (
    <div className="w-56 bg-white rounded-xl shadow-card border-2 border-fuchsia-200 overflow-hidden group hover:border-fuchsia-400 transition-colors">
      <div className="bg-fuchsia-50 p-3 border-b border-fuchsia-100 flex items-center gap-2">
        <div className="bg-fuchsia-500 text-white p-1.5 rounded-lg shadow-sm">
          <Shuffle size={16} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-fuchsia-900">Teste A/B</h3>
          <p className="text-[10px] text-fuchsia-600/80 leading-none mt-0.5">Randomizador</p>
        </div>
      </div>
      <div className="p-4 bg-white flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Caminho A</span>
          <span className="text-xs text-slate-500">{data.splitA || 50}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div className="bg-fuchsia-500 h-1.5 rounded-full" style={{ width: `${data.splitA || 50}%` }}></div>
        </div>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-fuchsia-400" />
      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} className="w-3 h-3 bg-fuchsia-400 top-1/3" />
      <Handle type="source" position={Position.Right} id="b" isConnectable={isConnectable} className="w-3 h-3 bg-fuchsia-400 top-2/3" />
    </div>
  );
});

export default RandomizerNode;
