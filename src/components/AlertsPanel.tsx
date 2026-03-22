import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MessageSquare, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Alert {
  id: string;
  nome: string;
  telefone: string | null;
  criado_em: string;
  controle_conversa: string;
}

export default function AlertsPanel() {
  const navigate = useNavigate();
  const { storeId } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    if (!storeId) return;
    setLoading(true);
    const { data } = await (supabase as any).from('leads')
      .select('id, nome, telefone, criado_em, controle_conversa')
      .eq('loja_id', storeId)
      .eq('precisa_humano', true)
      .order('criado_em', { ascending: false });
    setAlerts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const channel = supabase.channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchAlerts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const handleAttend = (alert: Alert) => {
    navigate(`/chat?lead=${alert.id}`);
  };

  const handleResolve = async (id: string) => {
    await (supabase as any).from('leads').update({ precisa_humano: false }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const formatDateTime = (ts: string) => new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  if (alerts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card p-6 rounded-2xl shadow-card text-center">
        <CheckCircle className="w-10 h-10 text-primary mx-auto mb-3" />
        <p className="text-foreground font-medium">Tudo em ordem!</p>
        <p className="text-sm text-muted-foreground">Nenhum alerta pendente.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <AnimatePresence mode="popLayout">
        {alerts.map(alert => (
          <motion.div key={alert.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} className="bg-card p-4 rounded-2xl shadow-card ring-2 ring-amber-400 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{alert.nome}</h3>
                <p className="text-xs text-muted-foreground">{alert.telefone || 'Sem telefone'}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1"><Clock className="w-3 h-3" />{formatDateTime(alert.criado_em)}</div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                {alert.controle_conversa === 'humano' ? '👤 Aguardando' : '🤖 Bot pausado'}
              </span>
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAttend(alert)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"><MessageSquare className="w-4 h-4" /> Atender</motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleResolve(alert.id)} className="px-4 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium">Resolver</motion.button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
