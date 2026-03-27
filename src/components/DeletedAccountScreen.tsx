import { motion } from 'framer-motion';
import { Trash2, LogOut, MessageSquare, ShieldX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DeletedAccountScreen() {
  const { signOut, userName, storeName } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-red-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-slate-800/20 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full backdrop-blur-xl bg-white/5 p-8 md:p-12 rounded-[40px] border border-white/10 shadow-2xl relative z-10 text-center space-y-8"
      >
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl bg-red-900/20 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-red-900/30 blur-2xl rounded-full" />
            <Trash2 className="w-12 h-12 text-red-500 relative z-10" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Conta Eliminada
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
            {userName && <><span className="text-white font-bold">{userName}</span>, a</>} conta
            {storeName && <> da loja <span className="text-red-400 font-bold">{storeName}</span></>} foi
            permanentemente eliminada pelo administrador da plataforma.
          </p>
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3 text-left">
          <ShieldX className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Informação</p>
            <p className="text-xs text-slate-300">O acesso a esta conta foi revogado. Se acredita que isto foi um erro, contacte o suporte.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('https://wa.me/351936179188?text=A+minha+conta+foi+eliminada+e+gostaria+de+falar+com+o+suporte.', '_blank')}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all border border-white/10"
          >
            <MessageSquare className="w-5 h-5" />
            Contactar Suporte
          </motion.button>

          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-transparent text-slate-400 font-semibold hover:text-white transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>

        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-medium">
          CRM TOP — Tecnologia de Alto Desempenho
        </p>
      </motion.div>
    </div>
  );
}
