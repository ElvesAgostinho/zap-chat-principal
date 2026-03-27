import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, RefreshCw, Loader2, CheckCircle2, WifiOff, Send, AlertTriangle, RotateCcw, QrCode as QrIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ConnectionStatus = 'unknown' | 'loading' | 'connected' | 'disconnected' | 'qr_pending' | 'qr_loading' | 'error';

export default function WhatsAppConnectionPanel() {
  const { storeId } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

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
    if (data?.success === false) throw new Error(data.error || 'Erro na conexão');
    return data;
  }, [instanceName, storeId]);

  const checkStatus = useCallback(async () => {
    try {
      setStatus('loading'); setError(null);
      const data = await invoke('check_connection');
      if (data.status === 'connected') { 
        setStatus('connected'); 
        setQrCode(null); 
        setShowQrModal(false);
      } else {
        setStatus('disconnected');
      }
    } catch (err: any) { 
      setStatus('disconnected'); 
      setError(err.message); 
    }
  }, [invoke]);

  useEffect(() => { 
    if (instanceName) checkStatus(); 
    else setStatus('disconnected'); 
  }, [checkStatus, instanceName]);

  useEffect(() => {
    if (status !== 'qr_pending') return;
    const poll = setInterval(async () => {
      try { 
        const data = await invoke('check_connection'); 
        if (data.status === 'connected') { 
          setStatus('connected'); 
          setQrCode(null); 
          setShowQrModal(false);
          toast.success('Conexão estabelecida com sucesso! 🎉');
        } 
      } catch {}
    }, 4000);
    return () => clearInterval(poll);
  }, [status, invoke]);

  const handleConnect = async () => {
    try {
      setStatus('qr_loading'); setError(null); setQrCode(null);
      const data = await invoke('generate_qrcode');
      if (data.status === 'connected') { 
        setStatus('connected'); 
        toast.success('Dispositivo já conectado');
        return; 
      }
      const base64 = data?.data?.base64;
      if (base64) { 
        setQrCode(base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`); 
        setStatus('qr_pending');
        setShowQrModal(true);
      } else {
        throw new Error(`QR não disponível. Payload recebido: ${JSON.stringify(data?.data || data).slice(0, 150)}`);
      }
    } catch (err: any) { 
      setStatus('error'); 
      setError(err.message); 
      toast.error(`Erro: ${err.message}`);
    }
  };

  const handleDisconnect = async () => { 
    try { 
      setStatus('loading'); 
      await invoke('logout'); 
      setStatus('disconnected'); 
      setQrCode(null); 
      toast.success('Dispositivo desconectado');
    } catch { 
      setStatus('disconnected'); 
    } 
  };

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
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-6 rounded-3xl border border-border shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${status === 'connected' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Conexão Digital</h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status Operacional</p>
            </div>
          </div>
          <button 
            onClick={checkStatus} 
            className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 transition-all border border-border"
          >
            <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-2xl border border-border/50">
          {status === 'connected' ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-sm font-bold text-emerald-600">Dispositivo Conectado</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
            </>
          ) : status === 'loading' || status === 'qr_loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">{status === 'qr_loading' ? 'Gerando QR...' : 'Verificando conexão...'}</span>
            </>
          ) : status === 'qr_pending' ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm text-amber-600 font-bold">Aguardando Escaneamento</span>
            </>
          ) : status === 'error' ? (
            <>
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-bold">Falha na Conexão</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground font-bold">Offline</span>
            </>
          )}
        </div>

        {error && status !== 'qr_pending' && (
          <p className="text-[11px] text-destructive bg-destructive/5 border border-destructive/10 px-4 py-3 rounded-2xl font-medium leading-relaxed">
            {error}
          </p>
        )}

        {!instanceName ? (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center space-y-2">
            <p className="text-xs text-amber-700 font-bold">⚠️ Instância Desconfigurada</p>
            <p className="text-[10px] text-amber-600">Configure o nome da instância no painel administrativo para habilitar o WhatsApp.</p>
          </div>
        ) : status === 'connected' ? (
          <div className="flex flex-col gap-2">
            <button onClick={handleResync} disabled={syncing} className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-border hover:bg-secondary/80 transition-all transition-all disabled:opacity-50">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              {syncing ? 'Sincronizando...' : 'Forçar Atualização'}
            </button>
            <button onClick={handleDisconnect} className="w-full px-4 py-3 rounded-2xl bg-destructive/10 text-destructive font-bold text-xs uppercase tracking-widest hover:bg-destructive/15 transition-all">
              Desconectar
            </button>
          </div>
        ) : (
          <button 
            onClick={handleConnect} 
            disabled={status === 'loading' || status === 'qr_loading'} 
            className="w-full px-4 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest disabled:opacity-50 shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {status === 'qr_pending' ? 'Ver QR Code' : 'Conectar Agora'}
          </button>
        )}

        {instanceName && (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">Instância</span>
            <span className="text-[11px] font-mono font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded-lg border border-border/30">{instanceName}</span>
          </div>
        )}
      </motion.div>

      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl p-8 backdrop-blur-xl bg-white/95">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shadow-glow mb-2">
              <QrIcon className="w-8 h-8" />
            </div>
            <DialogTitle className="text-2xl font-black font-display tracking-tight">Conecte seu WhatsApp</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium max-w-[280px]">
              Abra o WhatsApp no seu telemóvel, vá em <strong>Aparelhos conectados</strong> e escaneie o código abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center gap-8 py-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="relative p-6 bg-white rounded-[2rem] shadow-2xl border border-border/50 group"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-[2rem] animate-pulse group-hover:bg-primary/10 transition-colors" />
              {qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain relative z-10 rounded-xl" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center relative z-10">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              )}
            </motion.div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-3 px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-[0.1em]">Aguardando conexão em tempo real...</span>
              </div>
              <button 
                onClick={() => { setShowQrModal(false); setQrCode(null); }} 
                className="w-full px-4 py-3 rounded-2xl bg-secondary text-foreground font-black text-xs uppercase tracking-widest hover:bg-secondary/80 transition-all border border-border"
              >
                Cancelar Configuração
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
