import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';

const InputNode = memo(({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-white rounded-xl shadow-card border-2 border-indigo-200 overflow-hidden group hover:border-indigo-400 transition-colors">
      <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex items-center gap-2">
        <div className="bg-indigo-500 text-white p-1.5 rounded-lg shadow-sm">
          <HelpCircle size={16} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm text-indigo-900">Input do Utilizador</h3>
          <p className="text-[10px] text-indigo-600/80 leading-none mt-0.5">Pergunta & Resposta</p>
        </div>
      </div>
      <div className="p-4 bg-white text-sm text-slate-600 break-words leading-relaxed">
        {data.label || 'Qual é o seu nome?'}
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guardar em:</span>
        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
          {data.variable || 'custom_field'}
        </span>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400" />
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-400" />
    </div>
  );
});

export default InputNode;
