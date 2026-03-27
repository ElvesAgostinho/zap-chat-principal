import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, MessageSquare, RefreshCw, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeModal from './UpgradeModal';

export default function SuspendedScreen() {
  const { signOut, userName, storeName, statusLoja, isExpired, dataFim } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isManualSuspension = statusLoja === 'suspenso' && !isExpired;

  const formattedDate = dataFim
    ? new Date(dataFim).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  const handleContactSupport = () => {
    const message = `Olá! O acesso da minha loja *${storeName || 'Minha Loja'}* foi suspenso. Gostaria de regularizar a minha assinatura.`;
    window.open(`https://wa.me/351936179188?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg w-full backdrop-blur-xl bg-white/5 p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl relative z-10 text-center space-y-8"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-24 h-24 rounded-3xl bg-red-500/10 flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
            <ShieldAlert className="w-12 h-12 text-red-400 relative z-10" />
          </motion.div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            {isManualSuspension ? 'Conta Suspensa' : 'Licença Expirada'}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Olá, <span className="text-white font-bold">{userName || 'Administrador'}</span>.{' '}
            {isManualSuspension
              ? <>A loja <span className="text-primary font-bold">{storeName}</span> foi suspensa pela nossa equipa. Contacte o suporte para mais detalhes.</>
              : <>A licença da <span className="text-primary font-bold">{storeName}</span> expirou. Renove agora para continuar a vender sem interrupções.</>
            }
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-left">
            <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Status</p>
              <p className="text-xs text-white font-medium">
                {isManualSuspension ? 'Suspensa' : 'Expirada'}
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                {isManualSuspension ? 'Motivo' : 'Expirou em'}
              </p>
              <p className="text-xs text-white font-medium">
                {isManualSuspension ? 'Verificar suporte' : (formattedDate || 'N/D')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {!isManualSuspension && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setUpgradeOpen(true)}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-lg hover:brightness-110 transition-all"
            >
              <Zap className="w-5 h-5" />
              Renovar Agora — Upload PDF
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContactSupport}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all border border-white/10"
          >
            <MessageSquare className="w-5 h-5" />
            Falar com Suporte
          </motion.button>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-transparent text-slate-400 font-semibold hover:text-white transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>

        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium pt-2">
          CRM TOP — Tecnologia de Alto Desempenho
        </p>
      </motion.div>

      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
