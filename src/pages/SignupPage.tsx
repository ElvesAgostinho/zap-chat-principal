import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus, Store, Users, ChevronRight, ChevronLeft, MessageSquare, Building2, Phone, MapPin, User, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AccountType = null | 'admin' | 'employee';
type Step = 'role' | 'company' | 'account';

export default function SignupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<AccountType>(null);
  const [step, setStep] = useState<Step>('role');
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCode, setStoreCode] = useState('');

  const handleSelectRole = (type: AccountType) => {
    setAccountType(type);
    setStep(type === 'admin' ? 'company' : 'account');
  };

  const handleBack = () => {
    if (step === 'account' && accountType === 'admin') setStep('company');
    else { setStep('role'); setAccountType(null); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    if (accountType === 'admin' && !storeName.trim()) {
      toast({ title: 'Nome da empresa obrigatório', variant: 'destructive' }); return;
    }
    if (accountType === 'employee' && !storeCode.trim()) {
      toast({ title: 'Código da loja obrigatório', description: 'Peça o código ao administrador da loja.', variant: 'destructive' }); return;
    }

    setLoading(true);
    try {
      const metadata: Record<string, string> = {
        full_name: fullName.trim(),
        role: accountType === 'admin' ? 'admin' : 'employee',
      };
      if (accountType === 'admin') {
        metadata.store_name = storeName.trim();
        metadata.store_phone = storePhone.trim();
        metadata.store_address = storeAddress.trim();
      } else {
        metadata.store_code = storeCode.trim().toUpperCase();
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: metadata, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      // Trigger notification to super_admin if this is a new store creation
      if (accountType === 'admin') {
        try {
          await supabase.functions.invoke('notify-admin', {
            body: { 
              storeName: storeName.trim(), 
              adminName: fullName.trim(),
              adminEmail: email.trim().toLowerCase() 
            }
          });
        } catch (webhookError) {
          console.error("Erro ao notificar o super_admin (continua o fluxo de signup): ", webhookError);
          // We don't throw here because the user signup was already successful. We just log the error.
        }
      }

      toast({
        title: '🎉 Registo Concluído!',
        description: accountType === 'admin'
          ? 'A sua conta foi criada. Aguarde a aprovação do Super Admin.'
          : 'A sua conta foi criada. Aguarde a validação do administrador da loja.',
      });
      navigate('/login', { state: { email: email.trim().toLowerCase(), confirmationPending: false } });
    } catch (err: unknown) {
      toast({ title: 'Erro ao criar conta', description: err instanceof Error ? err.message : 'Erro inesperado', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = { enter: { x: 40, opacity: 0 }, center: { x: 0, opacity: 1 }, exit: { x: -40, opacity: 0 } };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }} 
            animate={{ scale: 1, opacity: 1, rotate: 0 }} 
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} 
            className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-primary shadow-glow mb-6 group cursor-pointer"
          >
            <MessageSquare className="w-10 h-10 text-primary-foreground group-hover:scale-110 transition-transform duration-500" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">Criar Conta</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            {step === 'role' && 'Como deseja usar o CRM TOP?'}
            {step === 'company' && 'Dados da sua empresa'}
            {step === 'account' && 'Dados da sua conta'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {['role', accountType === 'admin' ? 'company' : null, 'account'].filter(Boolean).map((s, i, arr) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${s === step ? 'bg-primary scale-110' : arr.indexOf(step as string) > i ? 'bg-primary/40' : 'bg-border'}`} />
              {i < arr.length - 1 && <div className="w-6 h-0.5 bg-border rounded" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div key="role" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4 }} className="space-y-4">
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => handleSelectRole('admin')} 
                className="w-full glassmorphism p-6 rounded-3xl text-left group hover:border-primary/40 transition-all duration-300 shadow-soft overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors duration-500">
                    <Store className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 group-hover:text-primary transition-colors duration-500">
                      Sou Dono / Admin 
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Configurar minha empresa e gerenciar a operação completa</p>
                  </div>
                </div>
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => handleSelectRole('employee')} 
                className="w-full glassmorphism p-6 rounded-3xl text-left group hover:border-slate-400/40 transition-all duration-300 shadow-soft overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-500/20 transition-colors duration-500">
                    <Users className="w-7 h-7 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 group-hover:text-slate-400 transition-colors duration-500">
                      Sou Funcionário 
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Aceder à equipa através do código da loja fornecido pelo Admin</p>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {step === 'company' && (
            <motion.div key="company" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <div className="bg-card p-6 rounded-2xl shadow-card space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Nome da Empresa *</label>
                  <Input value={storeName} onChange={e => setStoreName(e.target.value)} required placeholder="Ex: Calçados Premium Angola" className="mt-1" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Telefone</label>
                  <Input value={storePhone} onChange={e => setStorePhone(e.target.value)} placeholder="+244 9XX XXX XXX" className="mt-1" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Endereço</label>
                  <Input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="Luanda, Angola" className="mt-1" />
                </div>
                <div className="flex gap-3 pt-1">
                  <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={handleBack} className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm"><ChevronLeft className="w-4 h-4" /> Voltar</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => { if (!storeName.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; } setStep('account'); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20">Continuar <ChevronRight className="w-4 h-4" /></motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'account' && (
            <motion.div key="account" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
              <form onSubmit={handleSignup} className="bg-card p-6 rounded-2xl shadow-card space-y-4">
                <div className="flex items-center gap-2 pb-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${accountType === 'admin' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {accountType === 'admin' ? <Store className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    {accountType === 'admin' ? 'Dono / Admin' : 'Funcionário'}
                  </div>
                </div>

                {accountType === 'employee' && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Código da Loja *</label>
                    <Input value={storeCode} onChange={e => setStoreCode(e.target.value.toUpperCase())} required placeholder="Ex: A3K7B2" maxLength={6} className="mt-1 font-mono text-lg tracking-widest text-center" />
                    <p className="text-[10px] text-muted-foreground mt-1">Peça este código ao administrador da sua loja</p>
                  </div>
                )}

                <div>
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Nome Completo *</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Seu nome completo" className="mt-1" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Email *</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" className="mt-1" />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Senha *</label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} className="mt-1" />
                </div>

                <p className="text-[10px] text-center text-muted-foreground px-2">
                  Ao clicar em criar conta, concorda com os nossos <Link to="/terms" className="text-primary hover:underline">Termos</Link> e <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
                </p>

                <div className="flex gap-3 pt-1">
                  <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={handleBack} className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-secondary text-foreground font-medium text-sm"><ChevronLeft className="w-4 h-4" /></motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 shadow-md shadow-primary/20">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {loading ? 'Criando...' : 'Criar Conta'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta? <Link to="/login" className="text-primary font-semibold hover:underline">Entrar</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
