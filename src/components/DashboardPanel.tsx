import { motion } from 'framer-motion';
import { Users, Zap, MessageSquare, Target, Clock, ArrowUpRight } from 'lucide-react';
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
        {/* Atividade Recente Placeholder */}
        <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Actividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground flex-1">Novo lead entrou pelo Gatilho "Comprar"</span>
              <span className="text-xs font-mono text-slate-400">Agora</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-muted-foreground flex-1">Campanha de Boas Vindas concluída para João</span>
              <span className="text-xs font-mono text-slate-400">Há 5m</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 rounded-3xl border border-primary/10 flex flex-col items-center justify-center text-center">
          <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
          <h4 className="font-black text-xl mb-2">Sistema a funcionar em pleno! 🚀</h4>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">As automações estão activas e prontas a interagir com os seus leads.</p>
        </div>
      </div>
    </div>
  );
}
