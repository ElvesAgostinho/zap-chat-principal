import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, ShoppingBag, DollarSign, AlertTriangle, Clock, XCircle, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import CommandPalette from '@/components/CommandPalette';
import OrderCardEnhanced from '@/components/OrderCardEnhanced';
import ProductCard from '@/components/ProductCard';
import LeadCard from '@/components/LeadCard';
import AddProductSheet from '@/components/AddProductSheet';
import AddLeadSheet from '@/components/AddLeadSheet';
import CampaignsPanel from '@/components/CampaignsPanel';
import DashboardPanel from '@/components/DashboardPanel';
import AlertsPanel from '@/components/AlertsPanel';
import StoreConfigPanel from '@/components/StoreConfigPanel';
import ConversationsPanel from '@/components/ConversationsPanel';
import SchedulingPanel from '@/components/SchedulingPanel';
import PipelinePanel from '@/components/PipelinePanel';
import StockPanel from '@/components/StockPanel';
import AdminPanel from '@/pages/AdminPanel';
import { formatCurrency } from '@/data/mock';
import { Produto, Lead, Venda } from '@/types';

type Tab = 'dashboard' | 'orders' | 'chat' | 'clients' | 'products' | 'campaigns' | 'alerts' | 'settings' | 'admin' | 'schedule' | 'pipeline' | 'stock';

const TAB_TITLES: Record<Tab, string> = {
  dashboard: 'Painel Geral',
  orders: 'Pedidos',
  chat: 'Conversas',
  clients: 'Clientes',
  products: 'Produtos',
  campaigns: 'Campanhas',
  alerts: 'Alertas',
  settings: 'Configurações',
  admin: 'Administração',
  schedule: 'Agenda',
  pipeline: 'Pipeline',
  stock: 'Estoque',
};

export default function Index() {
  const navigate = useNavigate();
  const { role, storeId, signOut, user, loading, membershipState } = useAuth();
  
  const [activeTab, setActiveTabState] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('vendazap_tab');
    return (saved as Tab) || 'dashboard';
  });

  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    sessionStorage.setItem('vendazap_tab', tab);
  };

  const [products, setProducts] = useState<Produto[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const fetchAll = useCallback(async () => {
    if (!storeId) return;
    const [{ data: p }, { data: l }, { data: v }, { data: loja }] = await Promise.all([
      (supabase as any).from('produtos').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false }),
      (supabase as any).from('leads').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false }),
      (supabase as any).from('vendas').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false }),
      (supabase as any).from('lojas').select('nome, codigo_unico').eq('id', storeId).maybeSingle(),
    ]);
    setProducts(p || []);
    setLeads(l || []);
    setVendas(v || []);
    if (loja) { setStoreName(loja.nome || ''); setStoreCode(loja.codigo_unico || ''); }
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    fetchAll();
    const ch1 = supabase.channel('produtos-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => fetchAll()).subscribe();
    const ch2 = supabase.channel('leads-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchAll()).subscribe();
    const ch3 = supabase.channel('vendas-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, () => fetchAll()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [storeId, fetchAll]);

  useEffect(() => {
    if (!storeId) return;
    const fetchAlerts = async () => {
      const { count } = await (supabase as any).from('leads').select('id', { count: 'exact', head: true }).eq('loja_id', storeId).eq('precisa_humano', true);
      setAlertCount(count || 0);
    };
    fetchAlerts();
    const ch = supabase.channel('alerts-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchAlerts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    window.addEventListener('storage', onStorage);
    const interval = setInterval(onStorage, 500);
    return () => { window.removeEventListener('storage', onStorage); clearInterval(interval); };
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const totalSales = useMemo(() => vendas.filter(v => v.status !== 'cancelado').reduce((s, v) => s + (v.valor || 0), 0), [vendas]);
  const pendingCount = useMemo(() => vendas.filter(v => v.status === 'pendente').length, [vendas]);

  const handleDeleteAccount = async () => {
    if (!user) return;
    try { await (supabase as any).from('usuarios_loja').delete().eq('user_id', user.id); } catch {}
    await signOut();
  };

  if (user && !loading && membershipState !== 'linked' && membershipState !== 'super_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full bg-card rounded-3xl shadow-elevated p-10 text-center space-y-6 border border-border/50">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            {membershipState === 'pending' ? <Clock className="w-10 h-10 text-amber-500" /> : 
             membershipState === 'rejected' ? <XCircle className="w-10 h-10 text-destructive" /> :
             <AlertTriangle className="w-10 h-10 text-muted-foreground" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {membershipState === 'pending' ? 'Aguardando Aprovação' : 
               membershipState === 'rejected' ? 'Conta Rejeitada' : 'Acesso Restrito'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {membershipState === 'pending' ? 'Seu acesso está em análise pelo administrador.' : 
               membershipState === 'rejected' ? 'Seu vínculo foi recusado. Contacte o suporte.' : 'Esta conta não possui vínculo ativo.'}
            </p>
          </div>
          <div className="space-y-3">
            <button onClick={signOut} className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition-all">
              <LogOut className="w-4 h-4" /> Sair
            </button>
            <button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-destructive font-medium text-xs hover:bg-destructive/5 transition-all">
              Eliminar conta permanentemente
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPanel vendas={vendas} leads={leads} products={products} alertCount={alertCount} />;
      case 'orders':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card p-5 rounded-3xl shadow-card border border-border/50 stat-card">
                <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-3" />
                <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalSales)}</p>
                <p className="text-metadata text-[10px] mt-1">Vendas Totais</p>
              </div>
              <div className="bg-card p-5 rounded-3xl shadow-card border border-border/50 stat-card">
                <Clock className="w-6 h-6 text-amber-500 mb-3" />
                <p className="text-2xl font-bold text-foreground tabular-nums">{pendingCount}</p>
                <p className="text-metadata text-[10px] mt-1">Pendentes</p>
              </div>
              <div className="bg-card p-5 rounded-3xl shadow-card border border-border/50 stat-card">
                <ShoppingBag className="w-6 h-6 text-primary mb-3" />
                <p className="text-2xl font-bold text-foreground tabular-nums">{vendas.length}</p>
                <p className="text-metadata text-[10px] mt-1">Total Pedidos</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-metadata">{vendas.length} Pedidos localizados</h3>
              </div>
              {vendas.map(v => <OrderCardEnhanced key={v.id} venda={v} onOpenChat={(lid) => navigate(`/chat?lead=${lid}`)} />)}
            </div>
          </div>
        );
      case 'chat': return <ConversationsPanel />;
      case 'alerts': return <AlertsPanel />;
      case 'schedule': return <SchedulingPanel />;
      case 'pipeline': return <PipelinePanel leads={leads} />;
      case 'stock': return <StockPanel products={products} onUpdate={fetchAll} onAddProduct={() => { setEditingProduct(null); setShowAddProduct(true); }} onDeleteProduct={(id) => supabase.from('produtos').delete().eq('id', id).then(fetchAll)} onEditProduct={(p) => { setEditingProduct(p); setShowAddProduct(true); }} />;
      case 'products':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-metadata">{products.length} itens no catálogo</h3>
              <button onClick={() => setShowAddProduct(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-white text-sm font-bold shadow-glow">
                <Plus className="w-4 h-4" /> Novo Produto
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => <ProductCard key={p.id} product={p} onDelete={(id) => (supabase as any).from('produtos').delete().eq('id', id).then(fetchAll)} />)}
            </div>
          </div>
        );
      case 'clients':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-metadata">{leads.length} leads registrados</h3>
              <button onClick={() => setShowAddLead(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-white text-sm font-bold shadow-glow">
                <Plus className="w-4 h-4" /> Novo Lead
              </button>
            </div>
            <div className="space-y-3">
              {leads.map(l => <LeadCard key={l.id} lead={l} />)}
            </div>
          </div>
        );
      case 'campaigns': return <CampaignsPanel storeId={storeId} products={products} />;
      case 'settings': return <StoreConfigPanel />;
      case 'admin': return role === 'admin' ? <AdminPanel /> : null;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar 
        active={activeTab} 
        onChange={setActiveTab} 
        alertCount={alertCount} 
        orderCount={pendingCount} 
        showAdmin={role === 'admin'} 
        onSearch={() => setSearchOpen(true)} 
      />

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        leads={leads}
        products={products}
        vendas={vendas}
        onNavigateTab={setActiveTab}
        onNavigateChat={(id) => navigate(`/chat?lead=${id}`)}
      />

      <main 
        className="transition-all duration-500 ease-in-out min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? '68px' : '260px' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8 pt-20 lg:pt-8">
          {/* Unified Header */}
          <header className="mb-8 flex items-end justify-between">
            <motion.div
              key={activeTab + '-title'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{TAB_TITLES[activeTab]}</h1>
              <p className="text-sm text-metadata mt-1.5 flex items-center gap-2">
                {storeName} <span className="w-1 h-1 rounded-full bg-border" /> {storeCode}
              </p>
            </motion.div>
          </header>

          {/* Tab Content with AnimatePresence to solve "joining everything" bug */}
          <div className="relative min-h-[60vh]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full"
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AddProductSheet open={showAddProduct} onClose={() => { setShowAddProduct(false); setEditingProduct(null); }} storeId={storeId} onAdded={fetchAll} initialData={editingProduct} />
      <AddLeadSheet open={showAddLead} onClose={() => setShowAddLead(false)} storeId={storeId} />
    </div>
  );
}
