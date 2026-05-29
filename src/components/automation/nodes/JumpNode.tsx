import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ArrowRightCircle } from 'lucide-react';

const JumpNode = memo(({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-white rounded-xl shadow-card border-2 border-teal-200 overflow-hidden group hover:border-teal-400 transition-colors">
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
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-teal-400" />
    </div>
  );
});

export default JumpNode;
