import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, RefreshCw, Loader2, CheckCircle2, WifiOff, Send, AlertTriangle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ConnectionStatus = 'unknown' | 'loading' | 'connected' | 'disconnected' | 'qr_pending' | 'qr_loading' | 'error';

export default function WhatsAppConnectionPanel() {
  const { storeId } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    (supabase as any).from('lojas').select('instance_name').eq('id', storeId).maybeSingle()
      .then(({ data }: any) => { if (data?.instance_name) setInstanceName(data.instance_name); });
  }, [storeId]);

  const invoke = useCallback(async (action: string, extra: any = {}) => {
    if (!instanceName) throw new Error('Instância não configurada');
    const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
      body: { action, instance: instanceName, store_id: storeId, ...extra },
    });
    if (error) throw error;
    return data;
  }, [instanceName, storeId]);

  const checkStatus = useCallback(async () => {
    try {
      setStatus('loading'); setError(null);
      const data = await invoke('check_connection');
      if (data.status === 'connected') { setStatus('connected'); setQrCode(null); }
      else setStatus('disconnected');
    } catch (err: any) { setStatus('disconnected'); setError(err.message); }
  }, [invoke]);

  useEffect(() => { if (instanceName) checkStatus(); else setStatus('disconnected'); }, [checkStatus, instanceName]);

  useEffect(() => {
    if (status !== 'qr_pending') return;
    const poll = setInterval(async () => {
      try { const data = await invoke('check_connection'); if (data.status === 'connected') { setStatus('connected'); setQrCode(null); } } catch {}
    }, 4000);
    return () => clearInterval(poll);
  }, [status, invoke]);

  const handleConnect = async () => {
    try {
      setStatus('qr_loading'); setError(null); setQrCode(null);
      const data = await invoke('generate_qrcode');
      if (data.status === 'connected') { setStatus('connected'); return; }
      const base64 = data?.data?.base64;
      if (base64) { setQrCode(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`); setStatus('qr_pending'); }
      else throw new Error('QR não disponível');
    } catch (err: any) { setStatus('error'); setError(err.message); }
  };

  const handleDisconnect = async () => { try { setStatus('loading'); await invoke('logout'); setStatus('disconnected'); setQrCode(null); } catch { setStatus('disconnected'); } };

  const [syncing, setSyncing] = useState(false);
  const handleResync = async () => {
    try {
      setSyncing(true);
      const data = await invoke('force_sync');
      const count = data?.sync?.importedMessages || 0;
      const leads = data?.sync?.importedLeads || 0;
      toast.success(`Re-sincronizado: ${leads} contactos, ${count} mensagens importadas`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao re-sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Conexão WhatsApp</h3></div>
        <button onClick={checkStatus} className="p-1.5 rounded-lg bg-secondary text-muted-foreground"><RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} /></button>
      </div>
      <div className="flex items-center gap-3">
        {status === 'connected' ? <><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-sm font-medium text-emerald-600">Conectado</span><CheckCircle2 className="w-4 h-4 text-emerald-500" /></>
        : status === 'loading' || status === 'qr_loading' ? <><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm text-muted-foreground">{status === 'qr_loading' ? 'Gerando QR...' : 'Verificando...'}</span></>
        : status === 'qr_pending' ? <><div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" /><span className="text-sm text-amber-600 font-medium">Aguardando QR</span></>
        : status === 'error' ? <><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-sm text-destructive">Erro</span></>
        : <><WifiOff className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Não conectado</span></>}
      </div>
      <AnimatePresence>
        {qrCode && status === 'qr_pending' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center gap-3 py-4">
            <div className="bg-white p-3 rounded-2xl shadow-lg"><img src={qrCode} alt="QR" className="w-56 h-56 object-contain" /></div>
            <p className="text-xs text-muted-foreground text-center max-w-[280px]">WhatsApp → ⋮ → <strong>Aparelhos conectados</strong> → Escaneie</p>
          </motion.div>
        )}
      </AnimatePresence>
      {error && status !== 'qr_pending' && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-xl">{error}</p>}
      {!instanceName ? (
        <p className="text-xs text-muted-foreground bg-secondary px-3 py-2.5 rounded-xl text-center">Nenhuma instância configurada. Configure o nome da instância no painel Admin.</p>
      ) : status === 'connected' ? (
        <div className="flex flex-col gap-2">
          <button onClick={handleResync} disabled={syncing} className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {syncing ? 'Re-sincronizando...' : 'Re-sincronizar conversas'}
          </button>
          <button onClick={handleDisconnect} className="w-full px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive font-medium text-sm">Desconectar</button>
        </div>
      ) : status !== 'qr_pending' ? (
        <button onClick={handleConnect} disabled={status === 'loading' || status === 'qr_loading'} className="w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">Conectar via QR Code</button>
      ) : (
        <button onClick={() => { setStatus('disconnected'); setQrCode(null); }} className="w-full px-4 py-2.5 rounded-xl bg-secondary text-foreground font-medium text-sm">Cancelar</button>
      )}
      {instanceName && <p className="text-[11px] text-muted-foreground">Instância: <span className="font-mono text-foreground">{instanceName}</span></p>}
    </motion.div>
  );
}
