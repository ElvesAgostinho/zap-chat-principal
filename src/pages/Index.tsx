import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, ShoppingBag, DollarSign, AlertTriangle, Clock, XCircle, LogOut, Trash2, MessageSquare, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import CommandPalette from '@/components/CommandPalette';
import LeadCard from '@/components/LeadCard';
import AddLeadSheet from '@/components/AddLeadSheet';
import CampaignsPanel from '@/components/CampaignsPanel';
import DashboardPanel from '@/components/DashboardPanel';
import StoreConfigPanel from '@/components/StoreConfigPanel';
import LiveChat from '@/components/chat/LiveChat';
import AutomationPanel from '@/components/AutomationPanel';
import NotificationsCenter from '@/components/NotificationsCenter';
import AdminPanel from '@/pages/AdminPanel';
import PipelinePanel from '@/components/PipelinePanel';
import { formatCurrency } from '@/data/mock';
import { Produto, Lead, Venda, Tab } from '@/types';

const TAB_TITLES: Record<Tab, string> = {
  dashboard: 'Painel Geral',
  chat: 'Conversas',
  clients: 'Clientes',
  campaigns: 'Broadcasts',
  settings: 'Configurações',
  admin: 'Administração',
  automation: 'Automação Zap',
  pipeline: 'Funil de Vendas'
} as Record<Tab, string>;

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

    const ch1 = supabase.channel(`produtos-rt-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'produtos', filter: `loja_id=eq.${storeId}` }, () => fetchProducts()).subscribe();
    const ch2 = supabase.channel(`leads-rt-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `loja_id=eq.${storeId}` }, () => fetchLeads()).subscribe();
    const ch3 = supabase.channel(`vendas-rt-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'vendas', filter: `loja_id=eq.${storeId}` }, () => fetchVendas()).subscribe();
    const ch4 = supabase.channel(`mensagens-rt-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens', filter: `loja_id=eq.${storeId}` }, (payload: any) => {
      const newMsg = payload.new;
      if (newMsg && newMsg.loja_id === storeId) {
        if (role !== 'admin') {
          fetchMessages();
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
    const ch = supabase.channel(`alerts-rt-${storeId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `loja_id=eq.${storeId}` }, () => fetchAlerts()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [storeId]);

  useEffect(() => {
    const onStorage = () => setSidebarCollapsed(localStorage.getItem('sidebar_collapsed') === 'true');
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); };
  }, []);

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
    
    const confirmed = window.confirm("TEM CERTEZA? Esta ação irá eliminar o seu vínculo com esta loja permanentemente e não pode ser desfeita.");
    if (!confirmed) return;

    try { 
      await (supabase as any).from('usuarios_loja').delete().eq('user_id', user.id); 
    } catch (err) {
      console.error("Erro ao eliminar vínculo:", err);
    }
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
            leads={leads} 
            alertCount={alertCount} 
          />
        );
      case 'chat': return <LiveChat initialLeads={leads} initialAgents={agents} messages={messages} />;
      case 'pipeline': return <PipelinePanel leads={leads} />;
      case 'clients':
        return (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-metadata">{leads.length} leads registrados</h3>
              <button onClick={() => setShowAddLead(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl gradient-primary text-white text-sm font-bold shadow-glow">
                <Plus className="w-4 h-4" /> Novo Lead
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="px-6 py-4">Nome do Contato</th>
                    <th className="px-6 py-4">Telefone</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Etiqueta/Interesse</th>
                    <th className="px-6 py-4">Criado em</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate(`/chat?lead=${l.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                            {l.nome ? l.nome.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="font-bold text-slate-800">{l.nome || 'Sem Nome'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{l.telefone}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {l.status || 'NOVO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {l.interesse ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                            {l.interesse}
                          </span>
                        ) : '--'}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {l.criado_em ? new Date(l.criado_em).toLocaleDateString() : '--'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-sky-500 hover:text-sky-700 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Conversar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && (
                 <div className="p-8 text-center text-slate-500 text-sm">Nenhum lead encontrado.</div>
              )}
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
        orderCount={0} 
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
        className="transition-all duration-500 ease-in-out min-h-screen bg-[#F8FAFC]"
        style={{ marginLeft: '80px' }}
      >
        <div className={activeTab === 'chat' ? "h-screen flex flex-col pt-0" : "w-full px-8 py-8"}>
          {activeTab !== 'chat' && (
            <header className="mb-8 flex items-end justify-between border-b border-slate-200 pb-6">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-end justify-between w-full"
              >
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-3">
                    {activeTab === 'dashboard' && 'Dashboard'}
                    {activeTab === 'clients' && 'Contatos'}
                    {activeTab === 'campaigns' && 'Broadcasts'}
                    {activeTab === 'automation' && 'Automação'}
                    {activeTab === 'settings' && 'Configurações'}
                    {activeTab === 'admin' && 'Admin Panel'}
                  </h1>
                  <p className="text-slate-500 font-medium mt-1">
                    {activeTab === 'dashboard' && 'Visão geral do seu negócio'}
                    {activeTab === 'clients' && 'Gerencie sua lista de leads e clientes'}
                    {activeTab === 'campaigns' && 'Envie mensagens em massa'}
                    {activeTab === 'automation' && 'Crie fluxos de conversa automáticos'}
                    {activeTab === 'settings' && 'Configure seu sistema'}
                    {activeTab === 'admin' && 'Gestão avançada da loja'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mb-2">
                   <NotificationsCenter />
                </div>
              </motion.div>
            </header>
          )}

          {/* Tab Content with AnimatePresence to solve "joining everything" bug */}
          <div className={`relative ${activeTab === 'chat' ? 'flex-1 h-full pb-4 pr-4' : 'min-h-[60vh]'}`}>
            <AnimatePresence initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={activeTab === 'chat' ? 'w-full h-full' : 'w-full'}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AddLeadSheet open={showAddLead} onClose={() => setShowAddLead(false)} storeId={storeId} />
    </div>
  );
}
