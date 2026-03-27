import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Store, Wifi, WifiOff, Users, Trash2, Loader2, Copy, CheckCircle, UserCheck, XCircle, KeyRound, Code, ShieldCheck, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UsuarioLoja } from '@/types';
import ApiIntegrationPanel from '@/components/ApiIntegrationPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LojaRow {
  id: string;
  nome: string;
  telefone: string | null;
  codigo_unico: string;
  instance_name: string | null;
  instance_status: string | null;
  criado_em: string;
}

export default function AdminPanel() {
  const { signOut, storeId, plano, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [loja, setLoja] = useState<LojaRow | null>(null);
  const [employees, setEmployees] = useState<UsuarioLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'api'>('geral');
  const [connectingInProcess, setConnectingInProcess] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const isPro = plano === 'profissional' || plano === 'enterprise' || isSuperAdmin;

  const fetchData = async () => {
    setLoading(true);
    if (!storeId) { setLoading(false); return; }
    const [{ data: lojaData }, { data: empData }] = await Promise.all([
      (supabase as any).from('lojas').select('id, nome, telefone, codigo_unico, instance_name, instance_status, criado_em, plano, status_aprovacao').eq('id', storeId).maybeSingle(),
      (supabase as any).from('usuarios_loja').select('*').eq('loja_id', storeId).order('criado_em', { ascending: false }),
    ]);
    setLoja(lojaData);
    setEmployees(empData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [storeId]);

  const copyCode = () => {
    if (loja?.codigo_unico) {
      navigator.clipboard.writeText(loja.codigo_unico);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Código copiado!' });
    }
  };

  const pendingEmployees = employees.filter(e => e.status === 'pendente');
  const approvedEmployees = employees.filter(e => e.status === 'aprovado');
  const isConnected = loja?.instance_status === 'connected';

  const GET_MAX_EMPLOYEES = (p: string | null) => {
    if (p === 'enterprise') return 999;
    if (p === 'profissional') return 5;
    return 2; // Starter = 2 accounts total
  };

  const handleApprove = async (id: string) => {
    const currentCount = approvedEmployees.length;
    const maxCount = GET_MAX_EMPLOYEES(plano);

    if (currentCount >= maxCount && !isSuperAdmin) {
      toast({ 
        title: 'Limite de Usuários Atingido', 
        description: `O seu plano ${plano || 'Starter'} permite o balcão de até ${maxCount} utilizador(es). Por favor, contacte o suporte para fazer upgrade.`, 
        variant: 'destructive' 
      });
      return;
    }

    await (supabase as any).from('usuarios_loja').update({ status: 'aprovado' }).eq('id', id);
    toast({ title: 'Funcionário aprovado com sucesso!' });
    fetchData();
  };

  const handleReject = async (id: string) => {
    await (supabase as any).from('usuarios_loja').update({ status: 'rejeitado' }).eq('id', id);
    toast({ title: 'Funcionário rejeitado' });
    fetchData();
  };

  const handleConnectInstance = async () => {
    if (!loja) return;
    setConnectingInProcess(true);
    setConnectionError(null);
    const instanceName = loja.instance_name || `store_${loja.id.slice(0, 8)}`;
    console.log('[AdminPanel] Connecting instance:', instanceName);
    
    try {
      // Create instance if none exists
      if (!loja.instance_name) {
        const { data: createData, error: createError } = await supabase.functions.invoke('manage-instance', { body: { action: 'create', instanceName } });
        if (createError) throw createError;
        if (createData?.success === false) throw new Error(createData.error || 'Erro ao criar instância');
        await (supabase as any).from('lojas').update({ instance_name: instanceName }).eq('id', loja.id);
      }

      // Get QR via unified whatsapp-connection
      const { data, error } = await supabase.functions.invoke('whatsapp-connection', { 
        body: { action: 'generate_qrcode', instance: instanceName, store_id: loja.id } 
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Erro ao conectar');
      
      const base64 = data?.data?.base64;
      if (base64) {
        const qrSrc = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        setQrCode(qrSrc);
        setShowQrModal(true);
      } else if (data?.status === 'connected') {
        await (supabase as any).from('lojas').update({ instance_status: 'connected', instance_name: instanceName }).eq('id', loja.id);
        fetchData();
        toast({ title: 'WhatsApp já está conectado!' });
        return;
      } else {
        throw new Error(`QR não disponível no momento. Tente novamente em instantes.`);
      }

      // Poll status
      const poll = setInterval(async () => {
        const { data: s, error: sErr } = await supabase.functions.invoke('manage-instance', { body: { action: 'status', instanceName } });
        if (sErr) return;
        
        const state = s?.data?.instance?.state || s?.data?.state;
        if (state === 'open' || state === 'connected') {
          await (supabase as any).from('lojas').update({ instance_status: 'connected', instance_name: instanceName }).eq('id', loja.id);
          clearInterval(poll);
          setQrCode(null);
          setShowQrModal(false);
          fetchData();
          toast({ title: 'WhatsApp conectado com sucesso!' });
        }
      }, 5000);
      setTimeout(() => clearInterval(poll), 120000);
    } catch (err: any) {
      console.error('[AdminPanel] Connection error:', err);
      setConnectionError(err.message);
      toast({ title: 'Erro de Conexão', description: err.message, variant: 'destructive' });
    } finally {
      setConnectingInProcess(false);
    }
  };

  const handleDisconnectInstance = async () => {
    if (!loja?.instance_name) return;
    setConnectingInProcess(true);
    try {
      await supabase.functions.invoke('whatsapp-connection', { 
        body: { action: 'logout', instance: loja.instance_name, store_id: loja.id } 
      });
      await (supabase as any).from('lojas').update({ instance_status: 'disconnected' }).eq('id', loja.id);
      fetchData();
      toast({ title: 'WhatsApp desconectado com sucesso!' });
    } catch (err: any) {
      toast({ title: 'Erro ao desconectar', description: err.message, variant: 'destructive' });
    } finally {
      setConnectingInProcess(false);
    }
  };


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">CRM TOP</p>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Configurações Master</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('geral')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'geral' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              Geral
            </button>
            {isPro && (
              <button 
                onClick={() => setActiveTab('api')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'api' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                Integrações
              </button>
            )}
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="px-3 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium">Sair</motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : activeTab === 'api' ? (
        <ApiIntegrationPanel />
      ) : loja && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Store Code Section - Fixed Contrast */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-card p-6 rounded-[2rem] space-y-3 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Code className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-bold text-sm text-foreground uppercase tracking-widest">Código Único da Loja</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">Este é o seu identificador exclusivo. Use-o para integrações via API ou Webhooks externos.</p>
          <div className="flex items-center justify-between bg-secondary/50 p-6 rounded-2xl border border-border mt-4">
            <span className="text-4xl font-black text-foreground tracking-[0.4em] drop-shadow-sm">{loja.codigo_unico}</span>
            <button 
              onClick={() => { navigator.clipboard.writeText(loja.codigo_unico); toast({ title: 'Código copiado!' }); }}
              className="p-3 bg-white dark:bg-slate-800 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm border border-border/50"
            >
              <Copy className="w-5 h-5 text-primary" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 italic">* Mantenha este código em segurança.</p>
        </motion.div>
        {/* Store Name Display - New Location */}
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-card p-6 rounded-[2rem] space-y-3 shadow-card border border-border/50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2">
            <Store className="w-8 h-8 text-primary" />
            <p className="text-sm text-muted-foreground font-bold">Identidade da Loja:</p>
            <p className="text-2xl font-black text-foreground uppercase tracking-tighter text-center">{loja.nome}</p>
          </div>
        </motion.div>
      </div>

          {/* WhatsApp Connection */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-4 rounded-2xl shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">WhatsApp</span>
                <span className={`text-xs font-medium ${isConnected ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              {!isConnected ? (
                <motion.button 
                  whileTap={{ scale: 0.95 }} 
                  onClick={handleConnectInstance} 
                  disabled={connectingInProcess}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {connectingInProcess && <Loader2 className="w-3 h-3 animate-spin" />}
                  {connectingInProcess ? 'Conectando...' : 'Conectar'}
                </motion.button>
              ) : (
                <motion.button 
                  whileTap={{ scale: 0.95 }} 
                  onClick={handleDisconnectInstance} 
                  disabled={connectingInProcess}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {connectingInProcess && <Loader2 className="w-3 h-3 animate-spin" />}
                  {connectingInProcess ? 'Aguarde...' : 'Desconectar'}
                </motion.button>
              )}
            </div>
            {loja.instance_name && <p className="text-[10px] font-mono text-muted-foreground mt-1">{loja.instance_name}</p>}
            {connectionError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-xs text-destructive font-medium break-all">{connectionError}</p>
              </div>
            )}
          </motion.div>

          {/* Pending Employees */}
          {pendingEmployees.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-metadata flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {pendingEmployees.length} pendente(s)
              </h2>
              {pendingEmployees.map(emp => (
                <motion.div key={emp.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-4 rounded-2xl shadow-card ring-2 ring-amber-400/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{emp.nome || 'Sem nome'}</h3>
                      <p className="text-xs text-muted-foreground">Funcionário • Aguardando aprovação</p>
                    </div>
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleApprove(emp.id)} className="p-2 rounded-lg bg-primary/10 text-primary"><UserCheck className="w-4 h-4" /></motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleReject(emp.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive"><XCircle className="w-4 h-4" /></motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Approved Employees */}
          <div className="space-y-3">
            <h2 className="text-metadata"><Users className="w-3.5 h-3.5 inline mr-1" />{approvedEmployees.length} membro(s) aprovado(s)</h2>
            {approvedEmployees.map(emp => (
              <div key={emp.id} className="bg-card p-3 rounded-2xl shadow-card flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{emp.nome || 'Sem nome'}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{emp.role}</p>
                </div>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Ativo</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* WhatsApp QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={(open) => { setShowQrModal(open); if (!open) setQrCode(null); }}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-[2rem] p-8 shadow-elevated">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight">Conectar WhatsApp</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2 font-medium">
              Abra o WhatsApp no seu telemóvel, vá em <span className="text-foreground font-bold">Aparelhos Conectados</span> e escaneie o código abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 bg-secondary/30 rounded-3xl border border-border/50 mt-4">
            {qrCode ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-white rounded-2xl shadow-sm border border-border/20">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 rounded-xl" />
              </motion.div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
              </div>
            )}
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Aguardando Conexão...</p>
          </div>
          <div className="flex justify-center mt-4">
            <button onClick={() => setShowQrModal(false)} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">Cancelar Operação</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
