import React from 'react';
import { Bot, MessageSquare, Zap, Clock, Users, ArrowRight } from 'lucide-react';

export default function MockupFlowBuilder() {
  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-8 relative font-sans h-[400px]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        <path d="M 220 100 C 300 100, 300 100, 380 100" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M 580 100 C 660 100, 660 150, 740 150" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M 580 100 C 660 100, 660 250, 740 250" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <path d="M 220 280 C 300 280, 300 150, 380 150" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
      </svg>

      {/* Nodes */}
      <div className="relative z-10 w-full h-full">
        {/* Trigger Node */}
        <div className="absolute top-[60px] left-[20px] w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-emerald-500 px-4 py-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">Gatilho</span>
          </div>
          <div className="p-4">
            <div className="text-sm font-bold text-slate-800">Palavra-chave</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> "Quero comprar"
            </div>
          </div>
        </div>

        {/* Action Node 1 */}
        <div className="absolute top-[60px] left-[380px] w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ring-2 ring-blue-500">
          <div className="bg-blue-500 px-4 py-2 flex items-center gap-2">
            <Bot className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">Enviar Mensagem</span>
          </div>
          <div className="p-4">
            <div className="text-sm font-bold text-slate-800">Boas-vindas</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-2">
              Olá! Como posso ajudar-te hoje com o teu negócio?
            </div>
          </div>
        </div>

        {/* Delay Node */}
        <div className="absolute top-[240px] left-[20px] w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden opacity-75">
          <div className="bg-amber-500 px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">Atraso</span>
          </div>
          <div className="p-4">
            <div className="text-sm font-bold text-slate-800">Esperar 5 min</div>
          </div>
        </div>

        {/* Action Node 2 */}
        <div className="absolute top-[110px] left-[740px] w-[200px] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="bg-purple-500 px-4 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold">Adicionar Etiqueta</span>
          </div>
          <div className="p-4">
            <div className="text-sm font-bold text-slate-800">Lead Quente</div>
            <div className="text-xs text-slate-500 mt-1">Marca o cliente para follow-up</div>
          </div>
        </div>
      </div>
    </div>
  );
}
