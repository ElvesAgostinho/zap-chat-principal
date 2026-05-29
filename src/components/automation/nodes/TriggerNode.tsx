import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';

export default function TriggerNode({ data }: { data: any }) {
  return (
    <div className="w-64 shadow-elevated rounded-xl bg-white border-2 border-sky-500 overflow-hidden group hover:border-sky-400 transition-colors">
      <div className="bg-sky-50 px-4 py-2 flex items-center gap-2 border-b border-sky-100">
        <div className="p-1.5 bg-sky-500 rounded-md text-white">
          <Zap size={14} />
        </div>
        <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Gatilho Inicial</span>
      </div>
      <div className="p-4 bg-white">
        <p className="text-sm font-medium text-slate-700">{data.label}</p>
        <p className="text-xs text-slate-500 mt-1">Quando um cliente enviar esta mensagem, o fluxo começa.</p>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-sky-500 border-2 border-white rounded-full right-[-7px]"
      />
    </div>
  );
}
