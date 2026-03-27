import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Store, Users, ShoppingBag, CheckCircle, XCircle, Clock, LogOut,
  CreditCard, Eye, FileText, Loader2, BarChart3, Package, UserCheck
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
  status_aprovacao: 'pendente_aprovacao' | 'ativo' | 'suspenso' | 'cancelado';
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
  const { toast } = useToast();
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
      toast({ title: action === 'aprovar' ? '✅ Pagamento aprovado!' : '❌ Pagamento rejeitado' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
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
      toast({ title: action === 'aprovar' ? '✅ Admin aprovado!' : '❌ Admin rejeitado' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleStoreAction = async (id: string, action: 'aprovar' | 'suspend') => {
    setProcessingId(id);
    try {
      // 1. Update the store status AND plan
      const planoSelecionado = selectedPlans[id] || 'iniciante';
      await (supabase as any).from('lojas').update({
        status_aprovacao: action === 'aprovar' ? 'ativo' : 'suspenso',
        aprovado_em: action === 'aprovar' ? new Date().toISOString() : null,
        ...(action === 'aprovar' ? { plano: planoSelecionado } : {})
      }).eq('id', id);

      // 2. CRITICAL FIX: Also update usuarios_loja.status so get_my_membership
      //    returns 'aprovado' and the user can actually log in after approval.
      await (supabase as any).from('usuarios_loja').update({
        status: action === 'aprovar' ? 'aprovado' : 'rejeitado'
      }).eq('loja_id', id);

      toast({ title: action === 'aprovar' ? `✅ Loja Ativada! Plano: ${planoSelecionado}` : '⚠️ Loja Suspensa' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
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
              Lojas
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
            <TabsTrigger value="stores" className="shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 text-sm">Todas</TabsTrigger>
            <TabsTrigger value="subscriptions" className="shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 text-sm">Faturas</TabsTrigger>
            <TabsTrigger value="billing_config" className="shrink-0 font-display font-semibold transition-all data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-5 text-sm">Configuração</TabsTrigger>
          </TabsList>

          {/* New Stores Approval */}
          <TabsContent value="stores_pending" className="space-y-3 mt-4">
            {pendingStores.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary/30" />
                Nenhuma loja aguardando aprovação
              </div>
            ) : (
              pendingStores.map(l => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-4 rounded-2xl shadow-card ring-2 ring-orange-500/20 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{l.nome}</h3>
                      <p className="text-xs text-muted-foreground">Plano solicitado: <strong>{l.plano}</strong></p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Criada em: {new Date(l.criado_em).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-400/30">
                      <Clock className="w-3 h-3 mr-1" /> Aguardando Ativação
                    </Badge>
                  </div>

                  {/* Admin Info */}
                  <div className="bg-secondary/50 p-2.5 rounded-xl space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Responsável
                    </p>
                    {allAdmins.filter(a => a.loja_id === l.id).map(admin => (
                      <div key={admin.id} className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{admin.nome}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <p className="text-[11px] text-primary font-medium">{admin.email || 'Sem email'}</p>
                          <p className="text-[11px] text-emerald-500 font-mono">{admin.telefone || 'Sem telefone'}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Plan assignment dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Atribuir Plano</label>
                    <select
                      value={selectedPlans[l.id] || l.plano || 'iniciante'}
                      onChange={(e) => setSelectedPlans(prev => ({ ...prev, [l.id]: e.target.value }))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="iniciante">Iniciante (Grátis)</option>
                      <option value="starter">Starter — 25.000 Kz/mês</option>
                      <option value="profissional">Profissional — 50.000 Kz/mês</option>
                      <option value="enterprise">Enterprise — 100.000 Kz/mês</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStoreAction(l.id, 'aprovar')}
                      disabled={processingId === l.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium disabled:opacity-50"
                    >
                      {processingId === l.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Store className="w-4 h-4" />}
                      Ativar Empresa
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Pending Payments */}
          <TabsContent value="payments" className="space-y-3 mt-4">
            {pendingAssinaturas.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-primary/30" />
                Nenhum pagamento pendente
              </div>
            ) : (
              pendingAssinaturas.map(a => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-4 rounded-2xl shadow-card ring-2 ring-amber-400/50 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{(a as any).lojas?.nome || 'Loja'}</h3>
                      <p className="text-xs text-muted-foreground">
                        Plano: <strong className="text-foreground">{(a as any).planos?.nome}</strong> — {formatKz((a as any).planos?.preco || 0)}/mês
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(a.criado_em).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-amber-600 border-amber-400">
                      <Clock className="w-3 h-3 mr-1" /> Pendente
                    </Badge>
                  </div>

                  {a.comprovativo_url && (
                    <button
                      onClick={() => setViewingImage(a.comprovativo_url)}
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver comprovativo
                    </button>
                  )}

                  {a.notas && (
                    <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded-lg">{a.notas}</p>
                  )}

                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePaymentAction(a.id, 'aprovar')}
                      disabled={processingId === a.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {processingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Aprovar
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePaymentAction(a.id, 'rejeitar')}
                      disabled={processingId === a.id}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* All Stores */}
          <TabsContent value="stores" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">{lojas.length} loja(s) registada(s)</p>
            {lojas.map(loja => {
              const sub = assinaturas.find(a => a.loja_id === loja.id && a.status === 'ativo');
              return (
                <div key={loja.id} className="bg-card p-4 rounded-2xl shadow-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{loja.nome}</h3>
                      <p className="text-[10px] text-primary font-medium">/loja/{(loja as any).slug || loja.codigo_unico}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${loja.instance_status === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        loja.status_aprovacao === 'ativo' ? 'bg-emerald-100 text-emerald-700' :
                        loja.status_aprovacao === 'suspenso' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{loja.status_aprovacao}</span>
                    </div>
                  </div>

                  {/* Admin Info in All Stores List */}
                  <div className="flex flex-wrap gap-4 pt-1">
                    {allAdmins.filter(a => a.loja_id === loja.id).map(admin => (
                      <div key={admin.id} className="space-y-0.5 border-l-2 border-primary/20 pl-3">
                        <p className="text-xs font-bold text-foreground">{admin.nome}</p>
                        <p className="text-[10px] text-muted-foreground">{admin.email}</p>
                        <p className="text-[10px] text-emerald-500 font-mono">{admin.telefone}</p>
                      </div>
                    ))}
                  </div>
                  {loja.telefone && <p className="text-xs text-muted-foreground">{loja.telefone}</p>}
                  {/* Plan changer */}
                  {loja.status_aprovacao === 'ativo' && (
                    <div className="flex gap-2 items-center pt-1 border-t border-border/50">
                      <select
                        value={selectedPlans[loja.id] ?? loja.plano ?? 'iniciante'}
                        onChange={(e) => setSelectedPlans(prev => ({ ...prev, [loja.id]: e.target.value }))}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="iniciante">Iniciante (Grátis)</option>
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
                            const novoPlano = selectedPlans[loja.id] ?? loja.plano ?? 'iniciante';
                            await (supabase as any).from('lojas').update({ plano: novoPlano }).eq('id', loja.id);
                            toast({ title: `✅ Plano atualizado para ${novoPlano}` });
                            fetchAll();
                          } catch (err: any) {
                            toast({ title: 'Erro', description: err.message, variant: 'destructive' });
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        className="px-3 py-1.5 text-xs rounded-xl bg-primary text-white font-semibold disabled:opacity-50 whitespace-nowrap"
                      >
                        {processingId === loja.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Atualizar Plano'}
                      </motion.button>
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>


          {/* Active Subscriptions */}
          <TabsContent value="subscriptions" className="space-y-3 mt-4">
            <p className="text-xs text-muted-foreground">{activeAssinaturas.length} assinatura(s) ativa(s)</p>
            {activeAssinaturas.map(a => (
              <div key={a.id} className="bg-card p-4 rounded-2xl shadow-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{(a as any).lojas?.nome || 'Loja'}</h3>
                    <p className="text-xs text-muted-foreground">
                      {(a as any).planos?.nome} — {formatKz((a as any).planos?.preco || 0)}/mês
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0">
                    <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                  </Badge>
                </div>
                {a.data_fim && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Expira: {new Date(a.data_fim).toLocaleDateString('pt-AO')}
                  </p>
                )}
              </div>
            ))}
            {activeAssinaturas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma assinatura ativa</div>
            )}
          </TabsContent>

          <TabsContent value="billing_config" className="space-y-4 mt-6">
            <PlatformBillingConfig />
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Lightbox */}
      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingImage(null)}>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={viewingImage}
            alt="Comprovativo"
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
