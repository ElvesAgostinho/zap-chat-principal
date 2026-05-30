import React from 'react';
import { Bot, MessageSquare, Zap, Clock, Users, Database } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Seg', interacoes: 400 },
  { name: 'Ter', interacoes: 300 },
  { name: 'Qua', interacoes: 550 },
  { name: 'Qui', interacoes: 450 },
  { name: 'Sex', interacoes: 700 },
  { name: 'Sáb', interacoes: 200 },
  { name: 'Dom', interacoes: 350 },
];

export default function MockupAutomationBlocks() {
  return (
    <div className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left: Chart */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Desempenho da Automação</h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">+24% hoje</span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInteracoes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="interacoes" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorInteracoes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Automation Blocks List */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Blocos Disponíveis</h3>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Enviar Mensagem</p>
              <p className="text-xs text-slate-500">Envia texto, imagem ou áudio automaticamente</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Atraso (Delay)</p>
              <p className="text-xs text-slate-500">Espera um tempo antes da próxima ação</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Adicionar Etiqueta</p>
              <p className="text-xs text-slate-500">Organiza os contactos no CRM automaticamente</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
