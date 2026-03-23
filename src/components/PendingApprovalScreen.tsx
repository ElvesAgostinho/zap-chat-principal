import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, MessageCircle, LogOut, ShieldCheck, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import UpgradeModal from './UpgradeModal';

export default function PendingApprovalScreen() {
  const { signOut, userName, user } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      toast({
        title: 'Email reenviado',
        description: 'Verifique a sua caixa de entrada e a pasta de spam.',
      });
    } catch (err: any) {
      toast({ title: 'Erro ao reenviar', description: err.message, variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-card border border-border rounded-[32px] p-8 md:p-12 shadow-elevated relative z-10"
      >
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full border-4 border-dashed border-primary/30 flex items-center justify-center"
            >
              <Clock className="w-10 h-10 text-primary animate-pulse" />
            </motion.div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-card p-1 rounded-full">
              <ShieldCheck className="w-6 h-6 text-primary fill-primary/10" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-black tracking-tighter mb-4 italic uppercase">Sua conta está em análise!</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Olá, <span className="text-foreground font-bold">{userName?.split(' ')[0]}</span>. Por questões de segurança, todas as novas empresas no <span className="text-primary font-bold italic">VendaZap</span> passam por uma validação manual.
        </p>

        <div className="space-y-4 mb-10">
          <div className="flex items-start gap-4 text-left p-4 rounded-2xl bg-muted/30 border border-border/50">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-bold text-sm">Registo Concluído</p>
              <p className="text-xs text-muted-foreground">Seus dados foram recebidos com sucesso.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 text-left p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Aguardando Verificação</p>
              <p className="text-xs text-muted-foreground">Nossa equipa está revisando sua solicitação (normalmente em menos de 2h).</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUpgradeOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-black text-xs uppercase tracking-widest shadow-glow"
          >
            <ShieldCheck className="w-4 h-4" /> Ver Planos de Subscrição
          </motion.button>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open('https://wa.me/351936179188', '_blank')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest shadow-md"
            >
              <MessageCircle className="w-4 h-4" /> Suporte WhatsApp
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-secondary text-foreground font-black text-xs uppercase tracking-widest border border-border/50"
            >
              <LogOut className="w-4 h-4" /> Sair
            </motion.button>
          </div>
        </div>

        <button
          onClick={handleResendConfirmation}
          disabled={resending}
          className="w-full flex justify-center items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors p-2"
        >
          {resending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          {resending ? 'Reenviando...' : 'Reenviar email de confirmação'}
        </button>
      </motion.div>
      
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <p className="mt-8 text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-40">
        ZapVendas CRM &middot; Tecnologia para Escalar
      </p>
    </div>
  );
}
