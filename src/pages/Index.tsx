import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, ShoppingBag, DollarSign, AlertTriangle, Clock, XCircle, LogOut, Trash2, MessageSquare, Truck } from 'lucide-react';
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
import AutomationPanel from '@/components/AutomationPanel';
import DeliveryPanel from '@/components/DeliveryPanel';
import SchedulingPanel from '@/components/SchedulingPanel';
import PipelinePanel from '@/components/PipelinePanel';
import StockPanel from '@/components/StockPanel';
import AdminPanel from '@/pages/AdminPanel';
import { formatCurrency } from '@/data/mock';
import { Produto, Lead, Venda, Tab } from '@/types';

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
  automation: 'Automação Zap',
  delivery: 'Logística',
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
  const [agents, setAgents] = useState<{id: string, nome: string}[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const { storeName: authStoreName, storeCode: authStoreCode, storeSlug: authStoreSlug } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const fetchProducts = useCallback(async () => {
    if (!storeId) return;
    const { data } = await (supabase as any).from('produtos').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false });
    setProducts(data || []);
  }, [storeId]);

  const fetchLeads = useCallback(async () => {
    if (!storeId) return;
    const { data } = await (supabase as any).from('leads').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false });
    
    let filtered = data || [];
    if (role !== 'admin' && user?.id) {
      filtered = filtered.filter((l: any) => l.atendente_id === user.id);
    }
    setLeads(filtered);
  }, [storeId, role, user?.id]);

  const fetchVendas = useCallback(async () => {
    if (!storeId) return;
    const { data } = await (supabase as any).from('vendas').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false });
    setVendas(data || []);
  }, [storeId]);

  const fetchAgents = useCallback(async () => {
    if (!storeId) return;
    const { data } = await (supabase as any).from('usuarios_loja').select('user_id, nome').eq('loja_id', storeId).eq('status', 'aprovado');
    setAgents(data?.map((agent: any) => ({ id: agent.user_id, nome: agent.nome || 'Agente' })) || []);
  }, [storeId]);

  const fetchMessages = useCallback(async () => {
    if (!storeId) return;
    const { data } = await (supabase as any).from('mensagens').select('lead_id, lead_nome, conteudo, tipo, created_at, is_bot, respondido_por_nome').eq('loja_id', storeId).order('created_at', { ascending: false });
    
    let filteredMsgs = data || [];
    if (role !== 'admin' && user?.id) {
      // Funcionário só vê mensagens dos leads que são dele
      const { data: myLeads } = await (supabase as any).from('leads').select('id').eq('loja_id', storeId).eq('atendente_id', user.id);
      const myLeadIds = new Set((myLeads || []).map((l: any) => l.id));
      filteredMsgs = filteredMsgs.filter((m: any) => myLeadIds.has(m.lead_id));
    }
    
    setMessages(filteredMsgs);
  }, [storeId, role, user?.id]);

  const fetchAll = useCallback(async () => {
    if (!storeId) return;
    await Promise.all([fetchProducts(), fetchLeads(), fetchVendas(), fetchAgents(), fetchMessages()]);
  }, [fetchProducts, fetchLeads, fetchVendas, fetchAgents, fetchMessages, storeId]);

  useEffect(() => {
    if (!storeId) return;
    fetchAll();

    const ch1 = supabase.channel('produtos-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => fetchProducts()).subscribe();
    const ch2 = supabase.channel('leads-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchLeads()).subscribe();
    const ch3 = supabase.channel('vendas-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'vendas' }, () => fetchVendas()).subscribe();
    const ch4 = supabase.channel('mensagens-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens' }, (payload: any) => {
      const newMsg = payload.new;
      if (newMsg && newMsg.loja_id === storeId) {
        if (role !== 'admin') {
          fetchMessages(); // Force auth check
        } else {
          setMessages(prev => [newMsg, ...prev]);
        }
      } else fetchMessages();
    }).subscribe();
    
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      supabase.removeChannel(ch3);
      supabase.removeChannel(ch4);
    };
  }, [storeId, fetchProducts, fetchLeads, fetchVendas, fetchMessages, fetchAll]);

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
    // Remove setInterval as it's too aggressive and causes "heavy" UI
    return () => { window.removeEventListener('storage', onStorage); };
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
        return (
          <DashboardPanel 
            vendas={vendas} 
            leads={leads} 
            products={products} 
            alertCount={alertCount} 
            onAddLead={() => setShowAddLead(true)}
            onAddProduct={() => setShowAddProduct(true)}
          />
        );
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
                <p className="text-2xl font-bold text-foreground tabular-nums">{vendas?.length || 0}</p>
                <p className="text-metadata text-[10px] mt-1">Total Pedidos</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-metadata">{vendas?.length || 0} Pedidos localizados</h3>
              </div>
              {vendas && vendas.length > 0 ? (
                vendas.map(v => <OrderCardEnhanced key={v.id} venda={v} onOpenChat={(lid) => navigate(`/chat?lead=${lid}`)} />)
              ) : (
                <div className="bg-card p-10 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhum pedido encontrado</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'chat': return <ConversationsPanel initialLeads={leads} initialAgents={agents} messages={messages} />;
      case 'delivery': return <DeliveryPanel initialVendas={(vendas || []).filter(v => v.status_entrega !== 'entregue')} />;
      case 'alerts': return <AlertsPanel initialLeads={(leads || []).filter(l => l.precisa_humano)} />;
      case 'schedule': return <SchedulingPanel />;
      case 'pipeline': return <PipelinePanel leads={leads || []} />;
      case 'stock': return <StockPanel products={products || []} onUpdate={fetchAll} onAddProduct={() => { setEditingProduct(null); setShowAddProduct(true); }} onDeleteProduct={(id) => supabase.from('produtos').delete().eq('id', id).then(fetchAll)} onEditProduct={(p) => { setEditingProduct(p); setShowAddProduct(true); }} />;
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
      case 'automation': return <AutomationPanel />;
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
        storeName={authStoreName || ''}
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
          <header className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
            <motion.div
              key={activeTab + '-title'}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">{authStoreName || 'CRM TOP'}</h1>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    Official Hub
                </span>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.2em] border-l border-border pl-3">
                    {TAB_TITLES[activeTab]}
                </p>
              </div>
            </motion.div>
          </header>

          {/* Tab Content with AnimatePresence to solve "joining everything" bug */}
          <div className="relative min-h-[60vh]">
            <AnimatePresence initial={false}>
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
