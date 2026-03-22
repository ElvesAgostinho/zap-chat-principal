import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Loader2, LogIn, Mail, Zap, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginLocationState {
  email?: string;
  confirmationPending?: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const locationState = location.state as LoginLocationState | null;
  const [email, setEmail] = useState(locationState?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [canResendConfirmation, setCanResendConfirmation] = useState(
    Boolean(locationState?.confirmationPending && locationState?.email)
  );

  // Initialize theme
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCanResendConfirmation(false);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) throw error;
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado ao entrar';

      if (errorMessage.toLowerCase().includes('email not confirmed')) {
        setCanResendConfirmation(true);
        toast({
          title: 'Confirmação pendente',
          description: 'Confirme o seu email para entrar. Se precisar, reenvie o link abaixo.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Erro ao entrar', description: errorMessage, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast({
        title: 'Informe o email',
        description: 'Digite o email da conta para reenviar a confirmação.',
        variant: 'destructive',
      });
      return;
    }

    setResendingConfirmation(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setCanResendConfirmation(true);
      toast({
        title: 'Email reenviado',
        description: 'Se a conta existir e estiver pendente, enviámos um novo link de confirmação.',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado ao reenviar confirmação';
      toast({ title: 'Erro ao reenviar', description: errorMessage, variant: 'destructive' });
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.02] blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary mb-5 shadow-glow"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-bold text-foreground tracking-tight"
          >
            ZapVendas
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-1.5"
          >
            CRM inteligente via WhatsApp
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card p-7 rounded-3xl shadow-elevated border border-border/50 space-y-5"
        >
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="h-12 rounded-xl text-sm bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-1.5 block">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-12 rounded-xl text-sm bg-secondary/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {canResendConfirmation && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
                A conta foi criada, mas ainda precisa de confirmação por email. Se não recebeu o link, pode reenviar abaixo.
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl gradient-primary text-white font-semibold text-sm disabled:opacity-50 shadow-glow hover:shadow-elevated transition-all"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={!email.trim() || resendingConfirmation}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 h-11 text-sm font-medium text-foreground disabled:opacity-50 hover:bg-accent transition-colors"
          >
            {resendingConfirmation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {resendingConfirmation ? 'Reenviando...' : 'Reenviar email de confirmação'}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Não tem conta?{' '}
          <Link to="/signup" className="text-primary font-semibold hover:underline">
            Criar conta
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
