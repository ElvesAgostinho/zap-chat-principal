import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertTriangle, Copy, BarChart3, Bell, ArrowUpRight, ArrowDownRight, Target, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Produto, Lead, Venda } from '@/types';
import { formatCurrency } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DashboardPanelProps {
  vendas: Venda[];
  leads: Lead[];
  products: Produto[];
  alertCount: number;
}

const PIPELINE_COLORS = ['hsl(210, 14%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(43, 96%, 56%)', 'hsl(153, 60%, 40%)'];

export default function DashboardPanel({ vendas, leads, products, alertCount }: DashboardPanelProps) {
  const { role, storeId } = useAuth();
  const [storeCode, setStoreCode] = useState<string | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    if (!storeId || role !== 'admin') return;
    (supabase as any).from('lojas').select('codigo_unico').eq('id', storeId).maybeSingle()
      .then(({ data }: any) => { if (data) setStoreCode(data.codigo_unico); });
  }, [storeId, role]);

  const totalSales = vendas.filter(v => v.status !== 'cancelado').reduce((s, v) => s + (v.valor || 0), 0);
  const pendingOrders = vendas.filter(v => v.status === 'pendente').length;
  const paidOrders = vendas.filter(v => v.pagamento_status === 'pago').length;
  const deliveredOrders = vendas.filter(v => v.status_entrega === 'entregue').length;

  const clientCount = leads.filter(l => l.status === 'cliente' || l.status === 'comprado').length;
  const conversionRate = leads.length > 0 ? Math.round((clientCount / leads.length) * 100) : 0;

  const lowStockProducts = products.filter(p => p.estoque <= 3);

  // Sales chart data
  const chartData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();
    const data: { date: string; vendas: number; valor: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const dayVendas = vendas.filter(v => {
        const vDate = new Date(v.criado_em);
        return vDate.toDateString() === d.toDateString() && v.status !== 'cancelado';
      });
      data.push({
        date: dateStr,
        vendas: dayVendas.length,
        valor: dayVendas.reduce((s, v) => s + (v.valor || 0), 0),
      });
    }
    return data;
  }, [vendas, period]);

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
    { icon: DollarSign, label: 'Receita Total', value: formatCurrency(totalSales), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', trend: trend, showTrend: true },
    { icon: ShoppingBag, label: 'Pedidos', value: vendas.length.toString(), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', trend: 0, showTrend: false },
    { icon: Users, label: 'Leads / Clientes', value: `${leads.length - clientCount} / ${clientCount}`, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', trend: 0, showTrend: false },
    { icon: TrendingUp, label: 'Taxa Conversão', value: `${conversionRate}%`, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', trend: 0, showTrend: false },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-elevated text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
        <p className="text-muted-foreground">{payload[0].payload.vendas} pedido(s)</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header Actions */}
      <div className="flex items-center justify-end">
        {storeCode && (
          <button
            onClick={() => { navigator.clipboard.writeText(storeCode); toast.success('Código copiado!'); }}
            className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-2xl text-xs font-bold shadow-card border border-border/40 hover:shadow-elevated transition-all group"
          >
            <span className="text-muted-foreground uppercase tracking-widest text-[9px]">Código da Loja</span>
            <span className="font-mono text-foreground">{storeCode}</span>
            <Copy className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="bg-card p-4 rounded-2xl shadow-card border border-border/50 stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              {stat.showTrend && stat.trend !== 0 && (
                <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  stat.trend > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {stat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(stat.trend)}%
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {alertCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{alertCount} lead(s) aguardando atendimento</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Clique em Alertas para atender</p>
          </div>
        </motion.div>
      )}

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{lowStockProducts.length} produto(s) com estoque baixo</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">{lowStockProducts.map(p => p.nome).join(', ')}</p>
          </div>
        </motion.div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-card border border-border/50"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Vendas
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Evolução de receita</p>
            </div>
            <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
              {(['7d', '30d', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                    period === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Tudo'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pipeline donut */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
        >
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-primary" />
            Pipeline
          </h3>
          {pipelineData.length > 0 ? (
            <>
              <div className="flex justify-center">
                <div className="w-[160px] h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={72}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {pipelineData.map((_, idx) => (
                          <Cell key={idx} fill={PIPELINE_COLORS[idx % PIPELINE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                {pipelineData.map((stage, idx) => (
                  <div key={stage.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIPELINE_COLORS[idx % PIPELINE_COLORS.length] }} />
                    <span className="text-xs text-muted-foreground flex-1">{stage.name}</span>
                    <span className="text-xs font-semibold text-foreground tabular-nums">{stage.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Target className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-xs">Sem leads</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pipeline quick bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
      >
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Status dos Pedidos
        </h3>
        <div className="flex gap-2">
          {[
            { label: 'Pendentes', count: pendingOrders, color: 'bg-amber-500' },
            { label: 'Pagos', count: paidOrders, color: 'bg-blue-500' },
            { label: 'Entregues', count: deliveredOrders, color: 'bg-emerald-500' },
          ].map(s => (
            <div key={s.label} className="flex-1 text-center">
              <div className={`${s.color} text-white text-xl font-bold rounded-xl py-3 mb-1.5 transition-transform hover:scale-[1.02]`}>{s.count}</div>
              <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent orders */}
      {recentVendas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-5 shadow-card border border-border/50"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Pedidos Recentes
          </h3>
          <div className="space-y-1.5">
            {recentVendas.map(v => (
              <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{v.cliente_nome || 'Cliente'}</p>
                  <p className="text-[11px] text-muted-foreground">{v.produto} · {formatCurrency(v.valor)}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  v.status === 'pendente' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' :
                  v.status === 'pago' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                  v.status === 'cancelado' ? 'bg-red-500/10 text-red-700 dark:text-red-300' :
                  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}>{v.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
