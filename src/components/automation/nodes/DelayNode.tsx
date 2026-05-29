import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export default function DelayNode({ data }: { data: any }) {
  return (
    <div className="w-64 shadow-elevated rounded-xl bg-white border border-slate-200 overflow-hidden group hover:border-slate-400 transition-colors">
      <div className="bg-slate-50 px-4 py-2 flex items-center gap-2 border-b border-slate-100">
        <div className="p-1.5 bg-slate-500 rounded-md text-white">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Atraso Inteligente</span>
      </div>
      
      <div className="p-4 bg-white flex flex-col items-center justify-center">
        <p className="text-sm font-bold text-slate-700">{data.label || 'Esperar 15 Minutos'}</p>
      </div>

      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 bg-slate-300 border-2 border-white rounded-full left-[-7px]"
      />
      
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-slate-400 border-2 border-white rounded-full right-[-7px]"
      />
    </div>
  );
}
