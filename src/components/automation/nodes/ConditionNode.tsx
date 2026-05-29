import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

export default function ConditionNode({ data }: { data: any }) {
  return (
    <div className="w-64 shadow-elevated rounded-xl bg-white border border-slate-200 overflow-hidden group hover:border-amber-400 transition-colors">
      <div className="bg-amber-50 px-4 py-2 flex items-center gap-2 border-b border-amber-100">
        <div className="p-1.5 bg-amber-500 rounded-md text-white">
          <GitBranch className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Condição</span>
      </div>
      
      <div className="p-4 bg-white">
        <p className="text-sm font-medium text-slate-700">{data.label || 'Se o contacto tem a Tag "VIP"'}</p>
      </div>

      {/* Input */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-slate-300 border-2 border-white rounded-full left-[-7px]"
      />
      
      {/* Outputs: Yes and No */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="true"
        className="w-3 h-3 bg-sky-500 border-2 border-white rounded-full right-[-7px] top-[30%]"
      />
      <div className="absolute right-[-20px] top-[26%] text-[10px] font-bold text-sky-600">Sim</div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="false"
        className="w-3 h-3 bg-red-500 border-2 border-white rounded-full right-[-7px] top-[70%]"
      />
      <div className="absolute right-[-20px] top-[66%] text-[10px] font-bold text-red-600">Não</div>
    </div>
  );
}
