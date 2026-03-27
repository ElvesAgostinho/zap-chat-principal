import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const getPlanDisplayName = (p: string | null) => {
  const plan = (p || '').toLowerCase();
  if (plan === 'enterprise') return 'Enterprise';
  if (plan === 'profissional') return 'Profissional';
  return 'Starter'; // Fallback for 'iniciante' or empty
};

const getDaysLeft = (date: string | null) => {
  if (!date) return null;
  const fim = new Date(date);
  const hoje = new Date();
  const diffTime = fim.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
import {
  Store, Users, ShoppingBag, CheckCircle, XCircle, Clock, LogOut,
  CreditCard, Eye, FileText, Loader2, BarChart3, Package, UserCheck, Trash2, AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/AppHeader';
import SuperAdminNotifications from '@/components/SuperAdminNotifications';
import PlatformBillingConfig from '@/components/PlatformBillingConfig';
import { UsuarioLoja } from '@/types';

interface LojaInfo {
  id: string;
  nome: string;
  telefone: string | null;
  codigo_unico: string;
  instance_status: string | null;
  criado_em: string;
  owner_user_id: string | null;
  status_aprovacao: 'pendente_aprovacao' | 'ativo' | 'suspenso' | 'cancelado' | 'eliminado';
  plano: string;
}

interface Assinatura {
  id: string;
  loja_id: string;
  plano_id: string;
  status: string;
  comprovativo_url: string | null;
  notas: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  criado_em: string;
  lojas?: { nome: string } | null;
  planos?: { nome: string; preco: number } | null;
}

interface Stats {
  totalLojas: number;
  totalLeads: number;
  totalVendas: number;
  vendasValor: number;
  pendingPayments: number;
}

export default function SuperAdminPanel() {
  const { signOut } = useAuth();
  const { user } = useAuth();
  const [lojas, setLojas] = useState<LojaInfo[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [allAdmins, setAllAdmins] = useState<UsuarioLoja[]>([]);
  const [pendingUsers, setPendingUsers] = useState<(UsuarioLoja & { lojas: { nome: string } | null })[]>([]);
  const [stats, setStats] = useState<Stats>({ totalLojas: 0, totalLeads: 0, totalVendas: 0, vendasValor: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('stores_pending');
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: lojasData }, { data: assData }, { count: leadsCount }, { data: vendasData }, { data: adminsData }] = await Promise.all([
      (supabase as any).from('lojas').select('id, nome, telefone, codigo_unico, slug, instance_status, criado_em, owner_user_id, status_aprovacao, plano').order('criado_em', { ascending: false }),
      (supabase as any).from('assinaturas').select('*, lojas(nome), planos(nome, preco)').order('criado_em', { ascending: false }),
      (supabase as any).from('leads').select('id', { count: 'exact', head: true }),
      (supabase as any).from('vendas').select('valor, status'),
      (supabase as any).from('usuarios_loja').select('*').eq('role', 'admin'),
    ]);

    setLojas(lojasData || []);
    setAssinaturas(assData || []);
    setAllAdmins(adminsData || []);
    setPendingUsers((adminsData || []).filter(u => u.status === 'pendente') as any);

    const vendas = vendasData || [];
    const pending = (assData || []).filter((a: Assinatura) => a.status === 'aguardando_pagamento').length;

    setStats({
      totalLojas: (lojasData || []).length,
      totalLeads: leadsCount || 0,
      totalVendas: vendas.length,
      vendasValor: vendas.filter((v: any) => v.status !== 'cancelado').reduce((s: number, v: any) => s + (v.valor || 0), 0),
      pendingPayments: pending,
    });
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handlePaymentAction = async (id: string, action: 'aprovar' | 'rejeitar') => {
    setProcessingId(id);
    try {
      const update: Record<string, any> = {
        status: action === 'aprovar' ? 'ativo' : 'rejeitado',
        data_aprovacao: new Date().toISOString(),
      };
      if (action === 'aprovar') {
        update.data_inicio = new Date().toISOString();
        const fim = new Date();
        fim.setMonth(fim.getMonth() + 1);
        update.data_fim = fim.toISOString();
      }
      await (supabase as any).from('assinaturas').update(update).eq('id', id);
      toast(action === 'aprovar' ? '✅ Pagamento aprovado!' : '❌ Pagamento rejeitado');
      fetchAll();
    } catch (err: any) {
      toast("Erro", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleUserAction = async (id: string, action: 'aprovar' | 'rejeitar') => {
    setProcessingId(id);
    try {
      await (supabase as any).from('usuarios_loja').update({
        status: action === 'aprovar' ? 'aprovado' : 'rejeitado'
      }).eq('id', id);
      toast(action === 'aprovar' ? '✅ Admin aprovado!' : '❌ Admin rejeitado');
      fetchAll();
    } catch (err: any) {
      toast("Erro", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleStoreAction = async (id: string, action: 'aprovar' | 'suspend') => {
    setProcessingId(id);
    try {
      const planoSelecionado = selectedPlans[id] || 'starter';
      
      // 1. Update store
      await (supabase as any).from('lojas').update({
        status_aprovacao: action === 'aprovar' ? 'ativo' : 'suspenso',
        aprovado_em: action === 'aprovar' ? new Date().toISOString() : null,
        plano: planoSelecionado.toLowerCase()
      }).eq('id', id);

      // 2. Auto-create subscription on approval
      if (action === 'aprovar') {
        const { data: pData } = await (supabase as any).from('planos').select('id').ilike('nome', planoSelecionado).single();
        
        await (supabase as any).from('assinaturas').insert({
          loja_id: id,
          plano_id: pData?.id,
          status: 'ativo',
          data_inicio: new Date().toISOString(),
          data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notas: 'Ativação automática via Super Admin'
        });

        await (supabase as any).from('usuarios_loja').update({
          status: 'aprovado'
        }).eq('loja_id', id);
      }

      toast.success(action === 'aprovar' ? `✅ Loja Ativada: ${planoSelecionado.toUpperCase()}` : '⚠️ Loja Suspensa');
      fetchAll();
    } catch (err: any) {
      toast.error("Erro", { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteStore = async (id: string) => {
    setProcessingId(id);
    try {
      await (supabase as any).from('lojas').update({ status_aprovacao: 'eliminado' }).eq('id', id);
      await (supabase as any).from('usuarios_loja').update({ status: 'eliminado' }).eq('loja_id', id);
      toast.success('🗑️ Conta eliminada', { description: 'A loja foi permanentemente desativada.' });
      setConfirmDelete(null);
      fetchAll();
    } catch (err: any) {
      toast.error('Erro ao eliminar', { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingAssinaturas = assinaturas.filter(a => a.status === 'aguardando_pagamento');
  const activeAssinaturas = assinaturas.filter(a => a.status === 'ativo');
  const pendingStores = lojas.filter(l => l.status_aprovacao === 'pendente_aprovacao');

  const formatKz = (v: number) => v.toLocaleString('pt-AO') + ' Kz';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader
        storeName="CRM TOP"
        subtitle="Super Administrador"
        rightContent={
          <div className="flex items-center gap-2">
            <SuperAdminNotifications onNavigate={(tab) => setActiveTab(tab)} />
            <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors" title="Sair">
              <LogOut className="w-5 h-5" />
            </motion.button>
          </div>
        }
      />

      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold mb-1">Central de Comando</p>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Painel Super Admin</h1>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Store, label: 'Lojas', value: stats.totalLojas, color: 'text-primary', glow: 'bg-primary/20' },
            { icon: Users, label: 'Leads', value: stats.totalLeads, color: 'text-emerald-400', glow: 'bg-emerald-500/10' },
            { icon: ShoppingBag, label: 'Vendas', value: stats.totalVendas, color: 'text-slate-400', glow: 'bg-slate-500/10' },
            { icon: CreditCard, label: 'Pendentes', value: stats.pendingPayments, color: 'text-orange-400', glow: 'bg-orange-500/10' },
          ].map(({ icon: Icon, label, value, color, glow }) => (
            <motion.div 
              key={label} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glassmorphism p-4 rounded-3xl relative overflow-hidden group hover:border-primary/30 transition-all duration-500"
            >
              <div className={`absolute -right-2 -top-2 w-12 h-12 rounded-full blur-2xl ${glow} group-hover:scale-150 transition-transform duration-700`} />
              <Icon className={`w-5 h-5 ${color} mb-3 relative z-10`} />
              <p className="text-2xl font-display font-bold text-foreground tabular-nums relative z-10">{value}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest relative z-10">{label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex overflow-x-auto no-scrollbar justify-start border-b border-white/5 bg-white/5 backdrop-blur-xl rounded-2xl h-14 p-1">
            <TabsTrigger value="stores_pending" className="relative shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5">
              Novas Lojas
              {pendingStores.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-[10px] text-white flex items-center justify-center font-bold shadow-glow-orange border-2 border-background">
                  {pendingStores.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="relative font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5">
              Administradores
              {pendingUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center font-bold shadow-glow border-2 border-background">
                  {pendingUsers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments" className="relative font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5">
              Pagamentos
              {pendingAssinaturas.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold shadow-glow-destructive border-2 border-background">
                  {pendingAssinaturas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="stores" className="shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 text-sm">Todas Lojas</TabsTrigger>
            <TabsTrigger value="subscriptions" className="shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 text-sm">Faturas</TabsTrigger>
            <TabsTrigger value="billing_config" className="shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 text-sm">IBAN</TabsTrigger>
          </TabsList>

          {/* New Stores Approval */}
          <TabsContent value="stores_pending" className="space-y-3 mt-4">
            {pendingStores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm glassmorphism rounded-3xl">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary/30" />
                Nenhuma loja aguardando aprovação
              </div>
            ) : (
              pendingStores.map(l => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-4 rounded-3xl shadow-card ring-2 ring-primary/5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{l.nome}</h3>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        REGISTADA EM: {new Date(l.criado_em).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-400/30">
                      <Clock className="w-3 h-3 mr-1" /> PENDENTE
                    </Badge>
                  </div>

                  {/* Admin Info */}
                  <div className="bg-secondary/30 p-3 rounded-2xl flex items-center gap-3 border border-border/50">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <div>
                      {allAdmins.filter(a => a.loja_id === l.id).map(admin => (
                        <div key={admin.id}>
                          <p className="text-xs font-bold text-foreground">{admin.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{(admin as any).telefone || admin.user_id}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Plan assignment dropdown */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Plano Inicial</label>
                    <select
                      value={selectedPlans[l.id] || l.plano || 'starter'}
                      onChange={(e) => setSelectedPlans(prev => ({ ...prev, [l.id]: e.target.value }))}
                      className="w-full px-4 py-3 text-sm rounded-2xl border border-border bg-background font-bold focus:ring-2 focus:ring-primary/20 outline-none h-12"
                    >
                      <option value="starter">Starter — 25.000 Kz</option>
                      <option value="profissional">Profissional — 50.000 Kz</option>
                      <option value="enterprise">Enterprise — 100.000 Kz</option>
                    </select>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStoreAction(l.id, 'aprovar')}
                    disabled={processingId === l.id}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-[0.2em] shadow-glow"
                  >
                    {processingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar Agora'}
                  </motion.button>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Administrators - Full List */}
          <TabsContent value="users" className="space-y-3 mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2 mb-2">Gestores Registados ({allAdmins.length})</p>
            {allAdmins.map(admin => (
              <div key={admin.id} className="bg-card p-4 rounded-3xl shadow-sm border border-border/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{admin.nome}</h4>
                  <p className="text-[11px] text-primary">{(admin as any).lojas?.nome || 'Admin do Sistema'}</p>
                  <p className="text-[10px] text-muted-foreground">{(admin as any).email}</p>
                </div>
                <Badge className={admin.status === 'aprovado' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-orange-500/10 text-orange-600'}>
                  {admin.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </TabsContent>

          {/* Payments - Historical View */}
          <TabsContent value="payments" className="space-y-3 mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-2 mb-2">Fluxo de Pagamentos</p>
            {assinaturas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm glassmorphism rounded-3xl">Nenhum registo de pagamento</div>
            ) : (
              assinaturas.map(a => (
                <div key={a.id} className={`bg-card p-4 rounded-3xl shadow-sm border ${a.status === 'aguardando_pagamento' ? 'ring-2 ring-orange-500/30' : 'border-border/40'} space-y-3`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm">{(a as any).lojas?.nome}</h4>
                      <p className="text-xs font-black text-primary">{formatKz((a as any).planos?.preco || 0)}</p>
                    </div>
                    <Badge className={
                      a.status === 'ativo' ? 'bg-emerald-500/10 text-emerald-600' :
                      a.status === 'aguardando_pagamento' ? 'bg-orange-500/10 text-orange-600' : 
                      'bg-muted-foreground/10 text-muted-foreground'
                    }>
                      {a.status.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {a.status === 'aguardando_pagamento' && (
                    <div className="flex gap-2 pt-2">
                       <button 
                        onClick={() => handlePaymentAction(a.id, 'aprovar')}
                        className="flex-1 bg-emerald-500 text-white text-[10px] font-black py-2 rounded-xl transition-all hover:bg-emerald-600"
                       >
                         APROVAR
                       </button>
                       <button 
                        onClick={() => handlePaymentAction(a.id, 'rejeitar')}
                        className="flex-1 bg-destructive/10 text-destructive text-[10px] font-black py-2 rounded-xl"
                       >
                         REJEITAR
                       </button>
                       {a.comprovativo_url && (
                        <button onClick={() => setViewingImage(a.comprovativo_url)} className="p-2 rounded-xl bg-secondary"><Eye className="w-4 h-4" /></button>
                       )}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* All Stores List */}
          <TabsContent value="stores" className="space-y-4 mt-4">
            {lojas.map(loja => {
              const sub = assinaturas.find(a => a.loja_id === loja.id && a.status === 'ativo');
              return (
                <div key={loja.id} className="bg-card p-5 rounded-3xl shadow-card border border-border/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-primary/20 text-primary uppercase text-[9px] font-black tracking-widest px-2 py-0.5 border-0">
                          {getPlanDisplayName(loja.plano)}
                        </Badge>
                        <span className={`w-2 h-2 rounded-full ${loja.instance_status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{loja.nome}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">ID: {loja.codigo_unico}</p>
                    </div>
                    <Badge className={`px-3 py-1 rounded-full text-[10px] font-black border-0 ${
                      loja.status_aprovacao === 'ativo' ? 'bg-emerald-500/10 text-emerald-600' :
                      loja.status_aprovacao === 'suspenso' ? 'bg-destructive/10 text-destructive' :
                      'bg-orange-500/10 text-orange-600'
                    }`}>
                      {loja.status_aprovacao.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Expiration Banner - Centralized Management */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Ciclo de Faturamento</p>
                        {sub ? (
                          <div className="flex items-center gap-2">
                             <span className={`text-sm font-black ${getDaysLeft(sub.data_fim)! < 5 ? 'text-destructive underline decoration-wavy' : 'text-foreground'}`}>
                              {getDaysLeft(sub.data_fim)! > 0 
                                ? `${getDaysLeft(sub.data_fim)} DIAS` 
                                : 'EXPIRADO'}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-bold">({new Date(sub.data_fim).toLocaleDateString()})</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-xs text-destructive font-black">SEM VENCIMENTO DEFINIDO</span>
                            <span className="text-[9px] text-muted-foreground italic">Use o botão ao lado para fixar +30 dias</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const novaData = sub ? new Date(sub.data_fim) : new Date();
                        novaData.setDate(novaData.getDate() + 30);
                        
                        // Upsert logic for manual renewal
                        if (sub) {
                           await supabase.from('assinaturas').update({ data_fim: novaData.toISOString() }).eq('id', sub.id);
                        } else {
                           const { data: pData } = await (supabase as any).from('planos').select('id').ilike('nome', loja.plano || 'starter').single();
                           await supabase.from('assinaturas').insert({ 
                             loja_id: loja.id, 
                             plano_id: pData?.id,
                             status: 'ativo',
                             data_inicio: new Date().toISOString(),
                             data_fim: novaData.toISOString() 
                           });
                        }
                        
                        toast.success("✅ Acesso Renovado", { description: `A loja ${loja.nome} recebeu +30 dias.` });
                        fetchAll();
                      }}
                      className="px-6 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.15em] hover:shadow-glow transition-all active:scale-95"
                     >
                       +{sub ? '30 DIAS' : 'INICIAR CICLO'}
                     </button>
                   </div>

                   {/* Plan changer */}
                  <div className="flex gap-2 items-center pt-2">
                    <select
                      value={selectedPlans[loja.id] ?? loja.plano ?? 'starter'}
                      onChange={(e) => setSelectedPlans(prev => ({ ...prev, [loja.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none h-11 font-bold"
                    >
                      <option value="starter">Starter — 25.000 Kz</option>
                      <option value="profissional">Profissional — 50.000 Kz</option>
                      <option value="enterprise">Enterprise — 100.000 Kz</option>
                    </select>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      disabled={processingId === loja.id}
                      onClick={async () => {
                        setProcessingId(loja.id);
                        try {
                          const novoPlano = (selectedPlans[loja.id] ?? loja.plano ?? 'starter').toLowerCase();
                          await (supabase as any).from('lojas').update({ plano: novoPlano, status_aprovacao: 'ativo' }).eq('id', loja.id);
                          toast.success("Plano Sincronizado");
                          fetchAll();
                        } catch (err: any) {
                          toast.error(err.message);
                        } finally {
                          setProcessingId(null);
                        }
                      }}
                      className="h-11 px-6 rounded-xl bg-secondary text-foreground text-[10px] font-black uppercase tracking-widest border border-border/60 hover:bg-secondary/80"
                    >
                      {processingId === loja.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Sincronizar'}
                    </motion.button>
                  </div>

                   {/* Danger Zone */}
                   <button
                     onClick={() => setConfirmDelete(loja.id)}
                     className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-destructive/5 text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/20 hover:bg-destructive/10 transition-all mt-1"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                     Eliminar Conta
                   </button>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4 mt-4">
             {/* Full Invoices List */}
             {assinaturas.filter(a => a.status === 'ativo' || a.status === 'finalizada').map(f => (
               <div key={f.id} className="bg-card p-4 rounded-3xl shadow-sm border border-border/30 flex items-center justify-between">
                 <div>
                    <h4 className="font-bold text-sm">{(f as any).lojas?.nome}</h4>
                    <p className="text-[10px] text-muted-foreground uppercase">{new Date(f.criado_em).toLocaleDateString()} — {(f as any).planos?.nome}</p>
                 </div>
                 <p className="font-black text-primary text-xs">{formatKz((f as any).planos?.preco || 0)}</p>
               </div>
             ))}
          </TabsContent>

          <TabsContent value="billing_config" className="space-y-4 mt-6">
            <PlatformBillingConfig />
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDelete && (() => {
        const loja = lojas.find(l => l.id === confirmDelete);
        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-destructive/20 space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">Eliminar Conta?</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  A conta de <span className="font-bold text-foreground">{loja?.nome}</span> será permanentemente desativada. O utilizador não conseguirá mais aceder ao CRM.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-2xl bg-secondary text-foreground font-bold text-sm">Cancelar</button>
                <button
                  onClick={() => handleDeleteStore(confirmDelete)}
                  disabled={processingId === confirmDelete}
                  className="flex-1 py-3 rounded-2xl bg-destructive text-white font-black text-sm flex items-center justify-center gap-2"
                >
                  {processingId === confirmDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Eliminar</>}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Image Lightbox */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={viewingImage}
            alt="Comprovativo"
            className="max-w-full max-h-[85vh] rounded-3xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
