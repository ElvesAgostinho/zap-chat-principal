import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle, Copy, BarChart3, Bell, ArrowUpRight, ArrowDownRight, Target, Calendar, MessageSquare, Plus, Download, Globe, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Produto, Lead, Venda } from '@/types';
import { formatCurrency } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';

interface DashboardPanelProps {
  vendas: Venda[];
  leads: Lead[];
  products: Produto[];
  alertCount: number;
  onAddLead?: () => void;
  onAddProduct?: () => void;
}

const PIPELINE_COLORS = ['hsl(215, 25%, 65%)', 'hsl(217, 91%, 60%)', 'hsl(43, 96%, 56%)', 'hsl(158, 85%, 35%)'];

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export default function DashboardPanel({ vendas, leads, products, alertCount, onAddLead, onAddProduct }: DashboardPanelProps) {
  const { role, storeId, storeCode, storeSlug, dataFim, storeName } = useAuth();
  const isAdmin = role === 'admin';
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  const daysLeft = useMemo(() => {
    if (!dataFim) return null;
    const fim = new Date(dataFim);
    const hoje = new Date();
    const diffTime = fim.getTime() - hoje.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dataFim]);

  const handleRenew = () => {
    const message = `Olá! O acesso da minha loja *${storeName || 'Minha Loja'}* expira em breve (${daysLeft} dias). Gostaria de renovar a minha assinatura.`;
    window.open(`https://wa.me/351936179188?text=${encodeURIComponent(message)}`, '_blank');
  };
  const [activeTab, setActiveTab] = useState<'geral' | 'insights'>('geral');



  const totalSales = vendas.filter(v => v.status !== 'cancelado').reduce((s, v) => s + (v.valor || 0), 0);
  
  const totalCost = useMemo(() => {
    return vendas.filter(v => v.status !== 'cancelado').reduce((s, v) => {
      const p = products.find(prod => prod.nome === v.produto);
      return s + ((p?.custo_unitario || 0) * (v.quantidade || 1));
    }, 0);
  }, [vendas, products]);

  const realProfit = totalSales - totalCost;

  const revenueForecast = useMemo(() => {
    const now = new Date();
    const daysSinceStart = now.getDate();
    const dailyAvg = totalSales / Math.max(1, daysSinceStart);
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return dailyAvg * totalDays;
  }, [totalSales]);

  const coldLeadsCount = leads.filter(l => l.precisa_humano && l.status !== 'cliente').length;

  const pendingOrders = vendas.filter(v => v.status === 'pendente').length;
  const paidOrders = vendas.filter(v => v.pagamento_status === 'pago').length;
  const deliveredOrders = vendas.filter(v => v.status_entrega === 'entregue').length;

  const clientCount = leads.filter(l => l.status === 'cliente' || l.status === 'comprado').length;
  const conversionRate = leads.length > 0 ? Math.round((clientCount / leads.length) * 100) : 0;

  const lowStockProducts = products.filter(p => {
    if (p.variacoes && p.variacoes.length > 0) {
      return p.variacoes.some(v => v.estoque <= 3);
    }
    return p.estoque <= 3;
  });

  // Sales chart data
  const chartData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();
    const data: { date: string; vendas: number; valor: number; lucro: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayVendas = vendas.filter(v => {
        const vDate = new Date(v.criado_em);
        return vDate.toDateString() === d.toDateString() && v.status !== 'cancelado';
      });
      const dayRevenue = dayVendas.reduce((s, v) => s + (v.valor || 0), 0);
      const dayCost = dayVendas.reduce((s, v) => {
        const p = products.find(prod => prod.nome === v.produto);
        return s + ((p?.custo_unitario || 0) * (v.quantidade || 1));
      }, 0);

      data.push({
        date: dateStr,
        vendas: dayVendas.length,
        valor: dayRevenue,
        lucro: dayRevenue - dayCost,
      });
    }
    return data;
  }, [vendas, period, products]);

  // Pipeline donut data
  const pipelineData = useMemo(() => {
    const stages = [
      { name: 'Novo', count: leads.filter(l => l.status === 'novo' || !['interessado', 'quase_compra', 'cliente', 'comprado'].includes(l.status)).length },
      { name: 'Interessado', count: leads.filter(l => l.status === 'interessado').length },
      { name: 'Quase Compra', count: leads.filter(l => l.status === 'quase_compra').length },
      { name: 'Cliente', count: clientCount },
    ];
    return stages.filter(s => s.count > 0);
  }, [leads, clientCount]);

  // Recent orders
  const recentVendas = [...vendas].slice(0, 6);

  // Calculate trend (simple: compare first half vs second half of chart)
  const trend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const mid = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, mid).reduce((s, d) => s + d.valor, 0);
    const secondHalf = chartData.slice(mid).reduce((s, d) => s + d.valor, 0);
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }, [chartData]);

  const stats = [
    { icon: DollarSign, label: 'Lucro Real', value: formatCurrency(realProfit), color: 'text-primary', bg: 'bg-primary/10', trend: trend, showTrend: true },
    { icon: TrendingUp, label: 'Previsão Mensal', value: formatCurrency(revenueForecast), color: 'text-blue-500', bg: 'bg-blue-500/10', trend: 0, showTrend: false },
    { icon: Users, label: 'Potenciais Clientes', value: `${leads.length - clientCount}`, color: 'text-indigo-500', bg: 'bg-indigo-500/10', trend: 0, showTrend: false },
    { icon: AlertTriangle, label: 'Intervenção da IA', value: coldLeadsCount.toString(), color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 0, showTrend: false },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-2xl text-[11px] backdrop-blur-md">
        <p className="text-muted-foreground mb-1 font-bold uppercase tracking-wider">{label}</p>
        <p className="font-bold text-foreground text-base">{formatCurrency(payload[0].value)}</p>
        <p className="text-primary font-medium">{payload[0].payload.vendas} pedido(s)</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Expiration Banner */}
      {daysLeft !== null && daysLeft < 7 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-[24px] border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl ${
            daysLeft <= 0 
              ? 'bg-destructive/10 border-destructive/20 text-destructive' 
              : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              daysLeft <= 0 ? 'bg-destructive/20' : 'bg-orange-500/20'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider">Assinatura Próxima do Fim</p>
              <p className="text-xs opacity-80">
                {daysLeft <= 0 
                  ? 'O seu plano expirou hoje. Regularize o seu acesso para evitar bloqueios.' 
                  : `O seu acesso expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}. Renove agora e mantenha a sua operação ativa.`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleRenew}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
              daysLeft <= 0 
                ? 'bg-destructive text-white' 
                : 'bg-orange-500 text-white shadow-glow-orange'
            }`}
          >
            Renovar Agora
          </button>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/5 mb-6 overflow-x-auto scrollbar-hide">
        <button 
          onClick={() => setActiveTab('geral')}
          className={`px-6 py-4 text-[12px] font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === 'geral' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'}`}
        >
          Visão Estratégica
          {activeTab === 'geral' && (
            <motion.div 
              layoutId="tab-active-indicator" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(52,211,153,0.4)]" 
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('insights')}
          className={`px-6 py-4 text-[12px] font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === 'insights' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.02]'}`}
        >
          Análise de Desempenho
          {activeTab === 'insights' && (
            <motion.div 
              layoutId="tab-active-indicator" 
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(52,211,153,0.4)]" 
            />
          )}
        </button>
      </div>

      {activeTab === 'geral' ? (
        <div className="space-y-8">
          {/* Store Link Banner - Only show for store owners/agents, not super admins */}
          {storeId && (role !== 'super_admin') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden group p-6 rounded-2xl bg-muted/30 border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-50" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 shadow-glow">
                  <Globe className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg font-display">Hub Comercial Ativo 🚀</h3>
                  <p className="text-sm text-muted-foreground font-medium max-w-md">Capture leads e pedidos automaticamente através do seu catálogo digital premium.</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto relative z-10">
                <div className="flex-1 md:flex-none flex items-center gap-3 bg-secondary px-4 py-2.5 rounded-xl border border-border group min-w-[240px]">
                  <span className="text-[11px] text-muted-foreground font-medium truncate flex-1">
                    {window.location.host}/loja/{storeSlug || (storeName ? slugify(storeName) : '...')}
                  </span>
                  {(storeSlug || storeName) && (
                    <button
                      onClick={() => { 
                        const id = storeSlug || slugify(storeName || '');
                        const url = `${window.location.origin}/loja/${id}`;
                        navigator.clipboard.writeText(url); 
                        toast.success('Link copiado! ✅'); 
                      }}
                      className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors ml-auto flex-shrink-0"
                      title="Copiar link"
                    >
                      <Copy className="w-3.5 h-3.5 text-primary" />
                    </button>
                  )}
                </div>
                
                {(storeSlug || storeName) && (
                  <button
                    onClick={() => {
                      const id = storeSlug || slugify(storeName || '');
                      window.open(`https://wa.me/?text=${encodeURIComponent(`Confira nosso catálogo: ${window.location.origin}/loja/${id}`)}`, '_blank');
                    }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg hover:scale-105 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" /> Partilhar Link
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div 
                key={stat.label} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                transition={{ delay: i * 0.05 + 0.1 }} 
                className="bg-card/50 backdrop-blur-sm p-6 rounded-3xl border border-white/5 hover:border-primary/30 transition-all group shadow-sm hover:shadow-glow"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-11 h-11 rounded-2xl ${stat.bg} flex items-center justify-center border border-white/5 shadow-sm`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  {stat.showTrend && stat.trend !== 0 && (
                    <span className={`flex items-center gap-0.5 text-[10px] font-black px-2.5 py-1 rounded-full ${stat.trend > 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {stat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{Math.abs(stat.trend)}%
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums font-display">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mt-2 opacity-60">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Vendas</h3><p className="text-xs text-muted-foreground mt-0.5">Evolução de receita</p></div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => exportToCSV(vendas, 'relatorio_vendas')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Dados
                </button>
                <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
                  {(['7d', '30d', 'all'] as const).map(p => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>{p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Tudo'}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-[240px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                    stroke="transparent" 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                    stroke="transparent" 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#22C55E" 
                    strokeWidth={3} 
                    fill="url(#salesGradient)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Target className="w-4 h-4 text-primary" />Pipeline</h3>
              {pipelineData.length > 0 ? (
                <>
                  <div className="flex justify-center"><div className="w-[160px] h-[160px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pipelineData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} strokeWidth={0}>{pipelineData.map((_, idx) => (<Cell key={idx} fill={PIPELINE_COLORS[idx % PIPELINE_COLORS.length]} />))}</Pie></PieChart></ResponsiveContainer></div></div>
                  <div className="space-y-1.5 mt-3">{pipelineData.map((stage, idx) => (<div key={stage.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIPELINE_COLORS[idx % PIPELINE_COLORS.length] }} /><span className="text-xs text-muted-foreground flex-1">{stage.name}</span><span className="text-xs font-semibold text-foreground tabular-nums">{stage.count}</span></div>))}</div>
                </>
              ) : (<div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground"><Target className="w-8 h-8 opacity-30 mb-2" /><p className="text-xs">Sem leads</p></div>)}
            </motion.div>
          </div>

          {/* Orders Quick Bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Status dos Pedidos</h3>
            <div className="flex gap-2">
              {[{ label: 'Pendentes', count: pendingOrders, color: 'bg-amber-500' }, { label: 'Pagos', count: paidOrders, color: 'bg-blue-500' }, { label: 'Entregues', count: deliveredOrders, color: 'bg-emerald-500' }].map(s => (
                <div key={s.label} className="flex-1 text-center"><div className={`${s.color} text-white font-bold rounded-xl py-3 mb-1.5 text-xl`}>{s.count}</div><p className="text-[10px] text-muted-foreground font-medium">{s.label}</p></div>
              ))}
            </div>
          </motion.div>

          {/* Recent Orders */}
          {recentVendas.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-primary" />Pedidos Recentes</h3>
              <div className="space-y-1.5">
                {recentVendas.map(v => (
                  <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground truncate">{v.cliente_nome || 'Cliente'}</p><p className="text-[11px] text-muted-foreground">{v.produto} · {formatCurrency(v.valor)}</p></div>
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${v.status === 'pendente' ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'}`}>{v.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Receita vs Lucro</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient>
                      <linearGradient id="profit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="valor" name="Receita" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#revenue)" />
                    <Area type="monotone" dataKey="lucro" name="Lucro" stroke="hsl(158, 85%, 35%)" strokeWidth={3} fill="url(#profit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-card">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" />Performance por Produto</h3>
              <div className="space-y-4">
                {products.slice(0, 5).map(p => {
                  const productSales = vendas.filter(v => v.produto === p.nome && v.status !== 'cancelado');
                  const revenue = productSales.reduce((s, v) => s + (v.valor || 0), 0);
                  const cost = (p.custo_unitario || 0) * productSales.reduce((s, v) => s + (v.quantidade || 1), 0);
                  const profit = revenue - cost;
                  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div className="flex justify-between text-xs mb-1"><span className="font-bold">{p.nome}</span><span className="font-mono text-emerald-500">{margin}%</span></div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${margin}%` }} className="h-full bg-emerald-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/5 to-transparent p-8 rounded-3xl border border-primary/10 text-center">
            <Target className="w-12 h-12 text-primary mx-auto mb-4" />
            <h4 className="font-black text-xl mb-2">Foco no Lucro! 🚀</h4>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">Estas métricas ajudam você a investir nos produtos certos.</p>
          </div>
        </div>
      )}
    </div>
  );
}
