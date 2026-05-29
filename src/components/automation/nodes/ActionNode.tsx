import { Handle, Position } from '@xyflow/react';
import { Tag } from 'lucide-react';

export default function ActionNode({ data }: { data: any }) {
  return (
    <div className="w-64 shadow-soft rounded-xl bg-white border border-slate-200 overflow-hidden group hover:border-amber-400 transition-colors">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-slate-300 border-2 border-white rounded-full left-[-7px]"
      />
      <div className="bg-amber-50 px-4 py-2 flex items-center gap-2 border-b border-amber-100">
        <div className="p-1.5 bg-amber-500 text-white rounded-md">
          <Tag size={14} />
        </div>
        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Acção no CRM</span>
      </div>
      <div className="p-4 bg-white">
        <p className="text-sm font-medium text-slate-700">{data.label || 'Adicionar Tag: VIP'}</p>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-slate-300 border-2 border-white rounded-full right-[-7px]"
      />
    </div>
  );
}
