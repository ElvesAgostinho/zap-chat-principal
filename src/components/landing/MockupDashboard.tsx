import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, Line } from 'recharts';
import { Monitor, Share2, HelpCircle, ChevronDown, Settings } from 'lucide-react';

const data = [
  { day: '0', msgs: 45000, rate: 10 },
  { day: '1', msgs: 70000, rate: 25 },
  { day: '2', msgs: 65000, rate: 35 },
  { day: '3', msgs: 40000, rate: 45 },
  { day: '4', msgs: 30000, rate: 50 },
  { day: '5', msgs: 25000, rate: 55 },
  { day: '6', msgs: 20000, rate: 58 },
  { day: '7', msgs: 18000, rate: 60 },
  { day: '8', msgs: 15000, rate: 62 },
  { day: '10', msgs: 12000, rate: 64 },
  { day: '12', msgs: 10000, rate: 66 },
  { day: '15', msgs: 8000, rate: 68 },
  { day: '17.5', msgs: 6000, rate: 65 },
];

export default function MockupDashboard() {
  return (
    <div className="w-full bg-[#111827] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col font-sans relative">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-white font-black text-lg tracking-wider">
          USUÁRIOS: <span className="text-slate-400">ÚLTIMOS 7 DIAS</span> USANDO MEDIANA <ChevronDown className="w-5 h-5 ml-1 inline-block text-slate-400" />
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <Monitor className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <Share2 className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <HelpCircle className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row p-6 gap-8">
        {/* Chart 1 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Volume vs Taxa de Resposta</span>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-bold hover:text-white cursor-pointer transition-colors">
              <Settings className="w-4 h-4" /> OPÇÕES
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#0ea5e9', fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val) => \`\${val / 1000}K\`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#f472b6', fontSize: 10, fontWeight: 'bold' }} tickFormatter={(val) => \`\${val}%\`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: 'none', color: '#000', fontWeight: 'bold', padding: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Bar yAxisId="left" dataKey="msgs" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#f472b6" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center items-center gap-6 mt-4 text-xs font-bold">
            <div className="flex items-center gap-2 text-[#0ea5e9]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"></div> Mensagens Enviadas
            </div>
            <div className="flex items-center gap-2 text-[#f472b6]">
              <div className="w-4 h-1 bg-[#f472b6]"></div> Taxa de Resposta
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bottom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 pb-6 border-t border-slate-800/50 pt-6">
        <div>
          <div className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">MENSAGENS (LUX)</div>
          <div className="text-4xl font-extrabold text-[#0ea5e9]">479K</div>
          <div className="text-slate-500 text-xs font-bold mt-1">Total na semana</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">CONVERSÕES (LUX)</div>
          <div className="text-4xl font-extrabold text-[#f472b6]">40.6%</div>
          <div className="text-slate-500 text-xs font-bold mt-1">+12% vs anterior</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">LEADS GERADOS (LUX)</div>
          <div className="text-4xl font-extrabold text-white">12.4K</div>
          <div className="text-slate-500 text-xs font-bold mt-1">2.7K orgânicos</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">TEMPO DE RESPOSTA</div>
          <div className="text-4xl font-extrabold text-amber-400">0.7s</div>
          <div className="text-slate-500 text-xs font-bold mt-1">Mediana</div>
        </div>
      </div>
    </div>
  );
}
