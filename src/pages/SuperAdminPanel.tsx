import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Store, Users, ShoppingBag, CheckCircle, XCircle, Clock, LogOut,
  CreditCard, Eye, FileText, Loader2, BarChart3, Package
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import AppHeader from '@/components/AppHeader';

interface LojaInfo {
  id: string;
  nome: string;
  telefone: string | null;
  codigo_unico: string;
  instance_status: string | null;
  criado_em: string;
  owner_user_id: string | null;
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
  const [stats, setStats] = useState<Stats>({ totalLojas: 0, totalLeads: 0, totalVendas: 0, vendasValor: 0, pendingPayments: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: lojasData }, { data: assData }, { count: leadsCount }, { data: vendasData }] = await Promise.all([
      (supabase as any).from('lojas').select('id, nome, telefone, codigo_unico, instance_status, criado_em, owner_user_id').order('criado_em', { ascending: false }),
      (supabase as any).from('assinaturas').select('*, lojas(nome), planos(nome, preco)').order('criado_em', { ascending: false }),
      (supabase as any).from('leads').select('id', { count: 'exact', head: true }),
      (supabase as any).from('vendas').select('valor, status'),
    ]);

    setLojas(lojasData || []);
    setAssinaturas(assData || []);

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

  const pendingAssinaturas = assinaturas.filter(a => a.status === 'aguardando_pagamento');
  const activeAssinaturas = assinaturas.filter(a => a.status === 'ativo');

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
        rightContent={
          <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="p-2 rounded-lg bg-white/15 text-white" title="Sair">
            <LogOut className="w-4 h-4" />
          </motion.button>
        }
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-5">
        {/* Title */}
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Super Admin</p>
          <h1 className="text-xl font-bold text-foreground">Painel Central</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Store, label: 'Lojas', value: stats.totalLojas, color: 'text-primary' },
            { icon: Users, label: 'Leads', value: stats.totalLeads, color: 'text-blue-500' },
            { icon: ShoppingBag, label: 'Vendas', value: stats.totalVendas, color: 'text-amber-500' },
            { icon: CreditCard, label: 'Pendentes', value: stats.pendingPayments, color: 'text-red-500' },
          ].map(({ icon: Icon, label, value, color }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-3 rounded-2xl shadow-card">
              <Icon className={`w-4 h-4 ${color} mb-1`} />
              <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="payments" className="relative">
              Pagamentos
              {pendingAssinaturas.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center font-bold">
                  {pendingAssinaturas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="stores">Lojas</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          </TabsList>

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
                <div key={loja.id} className="bg-card p-4 rounded-2xl shadow-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{loja.nome}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{loja.codigo_unico}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${loja.instance_status === 'connected' ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                      {sub ? (
                        <Badge variant="secondary" className="text-[10px]">{(sub as any).planos?.nome}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Sem plano</Badge>
                      )}
                    </div>
                  </div>
                  {loja.telefone && <p className="text-xs text-muted-foreground mt-1">{loja.telefone}</p>}
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
