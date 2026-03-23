import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Store, CreditCard, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function SuperAdminNotifications({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingStores, setPendingStores] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  const fetchPendingCounts = async () => {
    try {
      const [
        { count: storesCount, error: storesErr }, 
        { count: paymentsCount, error: paymentsErr }
      ] = await Promise.all([
        (supabase as any).from('lojas').select('*', { count: 'exact', head: true }).eq('status_aprovacao', 'pendente_aprovacao'),
        (supabase as any).from('assinaturas').select('*', { count: 'exact', head: true }).eq('status', 'aguardando_pagamento')
      ]);
      
      if (!storesErr) setPendingStores(storesCount || 0);
      if (!paymentsErr) setPendingPayments(paymentsCount || 0);
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    fetchPendingCounts();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalPending = pendingStores + pendingPayments;

  return (
    <div className="relative z-50">
      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchPendingCounts(); }}
        className="relative p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        title="Notificações"
      >
        <Bell className="w-5 h-5" />
        {totalPending > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-primary text-[9px] font-black text-white flex items-center justify-center">
            {totalPending > 9 ? '9+' : totalPending}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-bold text-sm text-foreground">Aprovações Seguintes</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-tight mt-1">
                  Gerencie contas manualmente
                </p>
              </div>
              
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                {totalPending === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs font-medium">
                    Tudo limpo! Não há aprovações pendentes.
                  </div>
                ) : (
                  <>
                    {pendingStores > 0 && (
                      <button 
                        onClick={() => { onNavigate('stores_pending'); setIsOpen(false); }}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">Novas Empresas Registadas</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Existem {pendingStores} lojas aguardando validação manual.</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                    
                    {pendingPayments > 0 && (
                      <button 
                        onClick={() => { onNavigate('payments'); setIsOpen(false); }}
                        className="w-full text-left flex items-start gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-tight group-hover:text-primary transition-colors">Comprovativos de Upgrade</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Existem {pendingPayments} pagamentos aguardando aprovação.</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
