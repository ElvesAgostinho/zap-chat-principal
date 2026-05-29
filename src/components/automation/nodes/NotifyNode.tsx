import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BellRing } from 'lucide-react';

const NotifyNode = memo(({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-white rounded-xl shadow-card border-2 border-rose-200 overflow-hidden group hover:border-rose-400 transition-colors">
      <div className="bg-rose-50 p-3 border-b border-rose-100 flex items-center gap-2">
        <div className="bg-rose-500 text-white p-1.5 rounded-lg shadow-sm">
          <BellRing size={16} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-rose-900">Notificação</h3>
          <p className="text-[10px] text-rose-600/80 leading-none mt-0.5">Alertar Equipa</p>
        </div>
      </div>
      <div className="p-4 bg-white text-sm text-slate-600 break-words leading-relaxed italic border-l-2 border-rose-300 ml-4 mb-2">
        "{data.label || 'Lead precisa de ajuda humana!'}"
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-rose-400" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-rose-400" />
    </div>
  );
});

export default NotifyNode;
