import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Webhook } from 'lucide-react';

const WebhookNode = memo(({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-white rounded-xl shadow-card border-2 border-purple-200 overflow-hidden group hover:border-purple-400 transition-colors">
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
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-purple-400" />
      <Handle type="source" position={Position.Right} id="success" isConnectable={isConnectable} className="w-3 h-3 bg-purple-400 top-1/3" />
      <Handle type="source" position={Position.Right} id="error" isConnectable={isConnectable} className="w-3 h-3 bg-rose-400 top-2/3" />
    </div>
  );
});

export default WebhookNode;
