import { Handle, Position, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';

const WhatsAppIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function TriggerNode({ id, data }: { id: string, data: any }) {
  const { setNodes, setEdges } = useReactFlow();

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };
  return (
    <>
      <div className="w-64 shadow-elevated rounded-xl bg-white border-2 border-sky-500 overflow-hidden group hover:border-sky-400 transition-colors relative">
      
      <button 
        onClick={onDelete}
        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Apagar Nó"
      >
        <X size={14} strokeWidth={3} />
      </button>
      <div className="bg-[#25D366]/10 px-4 py-2 flex items-center gap-2 border-b border-[#25D366]/20">
        <div className="p-1.5 bg-[#25D366] rounded-md text-white">
          <WhatsAppIcon size={14} />
        </div>
        <span className="text-xs font-bold text-[#1da650] uppercase tracking-wider">Gatilho Inicial</span>
      </div>
      <div className="p-4 bg-white">
        <p className="text-sm font-medium text-slate-700">
          {data.triggerType === 'any_message' ? 'Qualquer mensagem recebida' : 
           data.triggerType === 'first_message' ? 'Primeira mensagem do lead' : 
           data.triggerType === 'tag_added' ? `Etiqueta adicionada: ${data.label}` :
           data.label || 'Palavra-chave'}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {data.triggerType === 'any_message' ? 'O fluxo começa com qualquer mensagem.' : 
           data.triggerType === 'first_message' ? 'O fluxo começa no primeiro contato.' : 
           data.triggerType === 'tag_added' ? 'O fluxo começa quando esta etiqueta for adicionada.' :
           'Quando o cliente enviar isto, o fluxo começa.'}
        </p>
      </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-sky-500 border-2 border-white rounded-full right-[-7px]"
      />
    </>
  );
}
