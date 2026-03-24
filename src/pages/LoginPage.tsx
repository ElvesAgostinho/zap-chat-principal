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
          title: 'Email não confirmado',
          description: 'Acesse seu email para confirmar a conta antes de entrar.',
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
    if (!normalizedEmail) return;
    setResendingConfirmation(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: normalizedEmail, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      toast({ title: 'Email reenviado', description: 'Por favor, consulte também a sua pasta de SPAM.' });
    } catch (err: unknown) {
      toast({ title: 'Erro ao reenviar', description: err instanceof Error ? err.message : 'Erro', variant: 'destructive' });
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-x-hidden overflow-y-auto">
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
            Bem-vindo de volta
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground mt-1.5"
          >
            Acesse seu painel no CRM TOP
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
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                  A sua conta precisa de confirmação por email para garantir a segurança.
                </p>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendingConfirmation}
                  className="w-full flex justify-center items-center gap-2 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs uppercase tracking-widest hover:bg-amber-500/20 transition-all border border-amber-500/20"
                >
                  {resendingConfirmation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  {resendingConfirmation ? 'Reenviando...' : 'Reenviar código por email'}
                </button>
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
        </motion.div>


        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-secondary/30 border border-border/50 p-5 rounded-2xl mt-6 text-center space-y-3"
          >
            <p className="text-sm text-muted-foreground">
              Ainda não faz parte do CRM TOP?
            </p>
            <Link 
              to="/signup" 
              className="inline-flex w-full items-center justify-center h-10 rounded-xl bg-background border border-primary/20 text-primary font-bold text-sm tracking-wide hover:bg-primary hover:text-white transition-all shadow-sm"
            >
              Criar Conta Agora
            </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
