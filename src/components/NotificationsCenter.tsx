import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Trash2, Calendar, ShoppingBag, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  tipo: 'agendamento' | 'pedido' | 'lead_quente' | 'sistema';
  titulo: string;
  mensagem: string;
  lida: boolean;
  link: string | null;
  criado_em: string;
}

export default function NotificationsCenter() {
  const { storeId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.lida).length;

  const fetchNotifications = async () => {
    if (!storeId) return;
    const { data } = await (supabase as any)
      .from('notificacoes')
      .select('*')
      .eq('loja_id', storeId)
      .order('criado_em', { ascending: false })
      .limit(20);
    setNotifications((data as any) || []);
  };

  useEffect(() => {
    fetchNotifications();
    if (!storeId) return;

    const channel = supabase
      .channel('notificacoes-realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notificacoes',
        filter: `loja_id=eq.${storeId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        toast(payload.new.titulo, {
          description: payload.new.mensagem,
          action: {
            label: 'Ver',
            onClick: () => setIsOpen(true)
          }
        });
        // Play subtle sound if possible
        try { new Audio('/notification.mp3').play().catch(() => {}); } catch {}
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [storeId]);

  const markAsRead = async (id: string) => {
    await (supabase as any).from('notificacoes').update({ lida: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const clearAll = async () => {
    if (!storeId) return;
    await (supabase as any).from('notificacoes').delete().eq('loja_id', storeId);
    setNotifications([]);
    setIsOpen(false);
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'agendamento': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'pedido': return <ShoppingBag className="w-4 h-4 text-green-500" />;
      case 'lead_quente': return <UserPlus className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-2 w-80 max-h-[400px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/20">
                <h3 className="font-semibold text-sm">Notificações</h3>
                {notifications.length > 0 && (
                  <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Limpar tudo
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2 text-muted-foreground">
                    <BellOff className="w-8 h-8 mx-auto opacity-20" />
                    <p className="text-xs">Tudo limpo por aqui!</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.lida && markAsRead(n.id)}
                      className={`p-4 border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-secondary/30 ${!n.lida ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">{getIcon(n.tipo)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-semibold ${!n.lida ? 'text-foreground' : 'text-muted-foreground'}`}>{n.titulo}</p>
                            {!n.lida && <Check className="w-3 h-3 text-primary" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{n.mensagem}</p>
                          <p className="text-[10px] text-muted-foreground/60">{formatDistanceToNow(new Date(n.criado_em), { addSuffix: true, locale: pt })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
