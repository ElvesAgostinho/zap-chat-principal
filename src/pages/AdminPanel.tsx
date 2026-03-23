import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Store, Wifi, WifiOff, Users, Trash2, Loader2, Copy, CheckCircle, UserCheck, XCircle, KeyRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UsuarioLoja } from '@/types';
import ApiIntegrationPanel from '@/components/ApiIntegrationPanel';

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
  const [activeTab, setActiveTab] = useState<'geral' | 'api'>('geral');
  
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

  const handleApprove = async (id: string) => {
    await (supabase as any).from('usuarios_loja').update({ status: 'aprovado' }).eq('id', id);
    toast({ title: 'Funcionário aprovado!' });
    fetchData();
  };

  const handleReject = async (id: string) => {
    await (supabase as any).from('usuarios_loja').update({ status: 'rejeitado' }).eq('id', id);
    toast({ title: 'Funcionário rejeitado' });
    fetchData();
  };

  const handleConnectInstance = async () => {
    if (!loja) return;
    const instanceName = loja.instance_name || `store_${loja.id.slice(0, 8)}`;
    try {
      // Create instance if none exists
      if (!loja.instance_name) {
        await supabase.functions.invoke('manage-instance', { body: { action: 'create', instanceName } });
        await (supabase as any).from('lojas').update({ instance_name: instanceName }).eq('id', loja.id);
      }
      // Get QR
      const { data, error } = await supabase.functions.invoke('manage-instance', { body: { action: 'connect', instanceName } });
      if (error) throw error;
      const base64 = data?.data?.base64;
      if (base64) {
        const qrSrc = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
        const w = window.open('', 'QR Code', 'width=400,height=500');
        if (w) {
          w.document.write(`<html><head><title>QR - ${instanceName}</title></head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;font-family:sans-serif;flex-direction:column;gap:16px"><img src="${qrSrc}" style="width:300px;height:300px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,0.1)"/><p style="color:#666;font-size:14px">Escaneie com WhatsApp</p></body></html>`);
        }
      }
      // Poll status
      const poll = setInterval(async () => {
        const { data: s } = await supabase.functions.invoke('manage-instance', { body: { action: 'status', instanceName } });
        const state = s?.data?.instance?.state || s?.data?.state;
        if (state === 'open' || state === 'connected') {
          await (supabase as any).from('lojas').update({ instance_status: 'connected', instance_name: instanceName }).eq('id', loja.id);
          clearInterval(poll);
          fetchData();
          toast({ title: 'WhatsApp conectado!' });
        }
      }, 5000);
      setTimeout(() => clearInterval(poll), 120000);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  const pendingEmployees = employees.filter(e => e.status === 'pendente');
  const approvedEmployees = employees.filter(e => e.status === 'aprovado');
  const isConnected = loja?.instance_status === 'connected';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-metadata mb-1">VendaZap</p>
          <h1 className="text-display text-lg">Configurações Master</h1>
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
          {/* Store Code - Prominent */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/5 border-2 border-primary/20 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">Código da Loja</h2>
            </div>
            <p className="text-xs text-muted-foreground">Compartilhe este código com os funcionários para se cadastrarem.</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold text-primary tracking-[0.3em]">{loja.codigo_unico}</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={copyCode} className="p-2 rounded-xl bg-primary/10 text-primary">
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </motion.button>
            </div>
            <p className="text-[11px] text-muted-foreground">Loja: <strong className="text-foreground">{loja.nome}</strong></p>
          </motion.div>

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
              {!isConnected && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleConnectInstance} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Conectar</motion.button>
              )}
            </div>
            {loja.instance_name && <p className="text-[10px] font-mono text-muted-foreground mt-1">{loja.instance_name}</p>}
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
    </div>
  );
}
