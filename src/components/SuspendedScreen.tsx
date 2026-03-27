import { motion } from 'framer-motion';
import { ShieldAlert, LogOut, MessageSquare, CreditCard, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SuspendedScreen() {
  const { signOut, userName, storeName } = useAuth();

  const handleContactSupport = () => {
    const message = `Olá! O acesso da minha loja *${storeName || 'Minha Loja'}* foi suspenso. Gostaria de regularizar a minha assinatura.`;
    window.open(`https://wa.me/351936179188?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full glassmorphism p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl relative z-10 text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center relative group">
            <div className="absolute inset-0 bg-destructive/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-700" />
            <ShieldAlert className="w-10 h-10 text-destructive relative z-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-display font-black tracking-tight text-white uppercase italic">
            Acesso Suspenso
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            Olá, <span className="text-white font-bold">{userName || 'Administrador'}</span>. 
            Identificámos que a assinatura da <span className="text-primary font-bold">{storeName}</span> expirou ou precisa de regularização.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Status Atual</p>
              <p className="text-xs text-white font-medium">Expirado</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Próximo Passo</p>
              <p className="text-xs text-white font-medium">Renovar Plano</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContactSupport}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold shadow-glow hover:brightness-110 transition-all border border-white/10"
          >
            Falar com Suporte & Renovar
            <MessageSquare className="w-5 h-5" />
          </motion.button>
          
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 text-slate-300 font-semibold hover:bg-white/10 transition-all border border-white/5"
          >
            Sair da Conta
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium pt-4">
          CRM TOP — Tecnologia de Alto Desempenho
        </p>
      </motion.div>
    </div>
  );
}
