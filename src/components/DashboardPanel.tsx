import { motion } from 'framer-motion';
import { Users, Zap, MessageSquare, Target, ArrowUpRight, TrendingUp, TrendingDown, CheckCircle2, Clock, Star } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, FunnelChart, Funnel, LabelList } from 'recharts';
import { Lead } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface DashboardPanelProps {
  leads: Lead[];
  alertCount: number;
}

export default function DashboardPanel({ leads, alertCount }: DashboardPanelProps) {
  const { storeName, storeId } = useAuth();
  const [activeAutomations, setActiveAutomations] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [prevWeekLeads, setPrevWeekLeads] = useState(0);
  
  const clientCount = leads.filter(l => l.status === 'cliente' || l.status === 'comprado' || l.status === 'vendido').length;
  const interestCount = leads.filter(l => l.status === 'interessado').length;
  const waitingCount = leads.filter(l => l.status === 'aguardando').length;
  const newCount = leads.filter(l => !l.status || l.status === 'novo').length;
  
  // Conversion rate: clients / total leads (if > 0)
  const conversionRate = leads.length > 0 ? ((clientCount / leads.length) * 100).toFixed(1) : '0.0';
  
  useEffect(() => {
    const fetchStats = async () => {
      if (!storeId) return;
      
      const { count: autoCount } = await supabase
        .from('automacoes')
        .select('*', { count: 'exact', head: true })
        .eq('loja_id', storeId)
        .eq('ativo', true);
        
      if (autoCount !== null) setActiveAutomations(autoCount);

      const { count: msgCount } = await supabase
        .from('mensagens')
        .select('*', { count: 'exact', head: true })
        .eq('loja_id', storeId);
        
      if (msgCount !== null) setTotalMessages(msgCount);

      // Fetch leads from 2 weeks ago to compare
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count: prevCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('loja_id', storeId)
        .gte('criado_em', twoWeeksAgo.toISOString())
        .lt('criado_em', oneWeekAgo.toISOString());

      if (prevCount !== null) setPrevWeekLeads(prevCount);
    };

    fetchStats();
  }, [storeId]);

  // Leads from the current week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const currentWeekLeads = leads.filter(l => l.criado_em && new Date(l.criado_em) >= oneWeekAgo).length;
  
  // Week-over-week trend
  const leadTrend = prevWeekLeads > 0 
    ? Math.round(((currentWeekLeads - prevWeekLeads) / prevWeekLeads) * 100)
    : currentWeekLeads > 0 ? 100 : 0;

  const stats = [
    { 
      icon: Users, 
      label: 'Contactos Totais', 
      value: leads.length, 
      color: 'text-sky-500', 
      bg: 'bg-sky-500/10',
      trend: leadTrend,
      sub: `${currentWeekLeads} esta semana`
    },
    { 
      icon: CheckCircle2, 
      label: 'Clientes Convertidos', 
      value: clientCount, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: 0,
      sub: `${conversionRate}% de conversão`
    },
    { 
      icon: Zap, 
      label: 'Automações Activas', 
      value: activeAutomations, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10',
      trend: 0,
      sub: 'a trabalhar para ti'
    },
    { 
      icon: MessageSquare, 
      label: 'Mensagens Trocadas', 
      value: totalMessages, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10',
      trend: 0,
      sub: 'total acumulado'
    },
  ];

  // Calculate real growth data for the last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const growthData = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const count = leads.filter(l => {
      if (!l.criado_em) return false;
      return l.criado_em.split('T')[0] === dateStr;
    }).length;
    
    return {
      name: date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', ''),
      leads: count
    };
  });

  // Funnel data with percentages
  const funnelStages = [
    { name: 'Novos', value: newCount, color: '#3b82f6', pct: leads.length > 0 ? Math.round((newCount / leads.length) * 100) : 0 },
    { name: 'Interessados', value: interestCount, color: '#f59e0b', pct: leads.length > 0 ? Math.round((interestCount / leads.length) * 100) : 0 },
    { name: 'Em Negociação', value: waitingCount, color: '#a855f7', pct: leads.length > 0 ? Math.round((waitingCount / leads.length) * 100) : 0 },
    { name: 'Clientes', value: clientCount, color: '#10b981', pct: leads.length > 0 ? Math.round((clientCount / leads.length) * 100) : 0 },
  ];

  // Top pipeline items
  const hotLeads = leads
    .filter(l => l.status === 'interessado' || l.status === 'aguardando')
    .slice(0, 5);

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
              {stat.trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] font-black px-2.5 py-1 rounded-full ${
                  stat.trend > 0 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  {stat.trend > 0 
                    ? <ArrowUpRight className="w-3 h-3" /> 
                    : <TrendingDown className="w-3 h-3" />
                  }
                  {Math.abs(stat.trend)}%
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums font-display">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mt-2 opacity-60">{stat.label}</p>
            <p className="text-[11px] text-muted-foreground mt-1 opacity-80">{stat.sub}</p>
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
                  formatter={(v: any) => [`${v} lead${v !== 1 ? 's' : ''}`, '']}
                />
                <Line type="monotone" dataKey="leads" stroke="#0ea5e9" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" /> Taxa de Conversão
            </h3>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <Star className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-sm font-black text-emerald-600">{conversionRate}%</span>
            </div>
          </div>

          <div className="space-y-3">
            {funnelStages.map((stage, i) => (
              <div key={stage.name} className="flex items-center gap-3">
                <div className="w-24 text-xs font-bold text-slate-600 text-right shrink-0">{stage.name}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(stage.pct, stage.value > 0 ? 4 : 0)}%` }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{ backgroundColor: stage.color }}
                  >
                    {stage.value > 0 && (
                      <span className="text-[10px] font-black text-white">{stage.value}</span>
                    )}
                  </motion.div>
                </div>
                <div className="w-10 text-xs font-bold text-slate-500 shrink-0">{stage.pct}%</div>
              </div>
            ))}
          </div>

          {/* Conversion Insight */}
          {leads.length > 0 && (
            <div className="mt-5 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-700">
                {clientCount === 0 
                  ? '🚀 Começa a fechar os teus primeiros negócios!'
                  : clientCount < 3 
                  ? `🎯 ${interestCount + waitingCount} leads em pipeline. Foca-te em converter!`
                  : `✅ ${clientCount} clientes convertidos de ${leads.length} contactos (${conversionRate}%)`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hot Leads Pipeline */}
      {hotLeads.length > 0 && (
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Pipeline Activo — Leads Quentes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hotLeads.map((lead, i) => (
              <motion.div
                key={lead.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-black shrink-0 ${
                  lead.status === 'aguardando' ? 'bg-purple-500' : 'bg-amber-500'
                }`}>
                  {(lead.nome || lead.telefone || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{lead.nome || lead.telefone}</p>
                  <p className="text-[10px] text-slate-500 capitalize">
                    {lead.status === 'aguardando' ? '🔥 Em Negociação' : '⭐ Interessado'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
