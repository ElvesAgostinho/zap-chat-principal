import { motion } from 'framer-motion';
import { Users, Zap, MessageSquare, Target, Clock, ArrowUpRight, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Lead } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardPanelProps {
  leads: Lead[];
  alertCount: number;
}

export default function DashboardPanel({ leads, alertCount }: DashboardPanelProps) {
  const { storeName } = useAuth();
  
  const clientCount = leads.filter(l => l.status === 'cliente').length;
  const activeAutomations = 3; // Placeholder for now
  
  const stats = [
    { icon: Users, label: 'Contactos Totais', value: leads.length, color: 'text-primary', bg: 'bg-primary/10', trend: 12 },
    { icon: Target, label: 'Clientes Convertidos', value: clientCount, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 5 },
    { icon: Zap, label: 'Automações Activas', value: activeAutomations, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 0 },
    { icon: MessageSquare, label: 'Mensagens Trocadas', value: '1.2k', color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: 20 },
  ];

  // Mock data for charts - in real app, derive from leads/sales over time
  const growthData = [
    { name: 'Seg', leads: 4 },
    { name: 'Ter', leads: 7 },
    { name: 'Qua', leads: 5 },
    { name: 'Qui', leads: 12 },
    { name: 'Sex', leads: 18 },
    { name: 'Sáb', leads: 25 },
    { name: 'Dom', leads: Math.max(10, leads.length) },
  ];

  const funnelData = [
    { name: 'Novos', value: leads.filter(l => !l.status || l.status === 'novo').length || 10 },
    { name: 'Interessados', value: leads.filter(l => l.status === 'interessado').length || 7 },
    { name: 'Em Negociação', value: leads.filter(l => l.status === 'aguardando').length || 5 },
    { name: 'Fechados', value: clientCount || 3 },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#a855f7', '#10b981'];

  return (
    <div className="space-y-6 pb-20 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground font-display">Bem-vindo(a), {storeName || 'Administrador'} 👋</h1>
        <p className="text-muted-foreground mt-1">Aqui tens um resumo da actividade das tuas automações e contactos.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={stat.label} 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: i * 0.05 }} 
            className="bg-card/50 backdrop-blur-sm p-6 rounded-3xl border border-border hover:border-primary/30 transition-all group shadow-sm hover:shadow-glow"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center border border-white/5 shadow-sm`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.trend > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <ArrowUpRight className="w-3 h-3" />{stat.trend}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums font-display">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mt-2 opacity-60">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Growth Chart */}
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" /> Crescimento de Leads (7 dias)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Chart */}
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" /> Taxa de Conversão
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }} width={100} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
