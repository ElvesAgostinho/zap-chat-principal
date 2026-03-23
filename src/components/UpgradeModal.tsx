import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Rocket, Diamond, Zap, Building2, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  price: string;
  icon: any;
  color: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '25.000 Kz',
    icon: Rocket,
    color: 'emerald',
    features: ['Até 200 Leads ativos', 'Vitrine Personalizada', 'Gestão de Pedidos', '2 Atendentes', 'Relatórios Básicos']
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: '50.000 Kz',
    icon: Zap,
    color: 'primary',
    features: ['Leads Ilimitados', 'BI & Relatórios de Lucro', 'Exportação de Dados', 'Até 5 Atendentes', 'Automações de Pós-Venda']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '100.000 Kz',
    icon: Diamond,
    color: 'violet',
    features: ['Tudo do Profissional', 'Atendentes Ilimitados', 'Domínio Customizado', 'API de Integração', 'Gerente Dedicado']
  }
];

// BUG-04 fix: Generate a stable reference per user, persisted in localStorage
function getOrCreateReference(): string {
  const key = 'zapvendas_payment_ref';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const newRef = 'ZAP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  localStorage.setItem(key, newRef);
  return newRef;
}

export default function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [reference] = useState(() => getOrCreateReference());
  const [bankConfig, setBankConfig] = useState({
    bank: 'BAI (Banco Angolano de Investimentos)',
    accountName: 'ZAP VENDAS TECNOLOGIA',
    iban: 'AO06 0000 0000 0000 0000 0000 0',
  });


  useEffect(() => {
    if (isOpen) {
      const fetchConfig = async () => {
        setLoadingConfig(true);
        try {
          const { data } = await (supabase as any).from('platform_config').select('*').eq('id', 1).maybeSingle();
          if (data) {
            setBankConfig({
              bank: data.bank_name || 'BAI',
              accountName: data.account_name || 'ZAP VENDAS TECNOLOGIA',
              iban: data.iban || 'AO06 0000 0000 0000 0000 0000 0',
            });
          }
        } catch (e) {
          console.error("Erro a carregar config", e);
        } finally {
          setLoadingConfig(false);
        }
      };
      fetchConfig();
    }
  }, [isOpen]);

  const handleConfirmTransfer = () => {
    if (!selectedPlan) return;
    const message = `Olá! Realizei a transferência para o plano *${selectedPlan.name}*. Em anexo o comprovativo. Ref: ${reference}`;
    window.open(`https://wa.me/351936179188?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleClose = () => {
    setSelectedPlan(null); // reset state when closing
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-card rounded-[32px] shadow-elevated border border-border overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* O scrollbar é aplicado apenas no conteúdo interno */}
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter mb-2 uppercase italic">Escale seu Negócio</h2>
                  <p className="text-muted-foreground">Escolha o plano ideal para sua operação e desbloqueie todo o poder do ZapVendas.</p>
                </div>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-muted transition-colors shrink-0">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!selectedPlan ? (
                // PASSO 1: Seleção de Planos
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className="p-6 rounded-2xl bg-muted/30 border border-border/50 hover:border-primary/50 transition-all flex flex-col group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-${plan.color}/10 flex items-center justify-center mb-6 text-${plan.color}`}>
                        <plan.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                      <p className="text-2xl font-black mb-6">{plan.price}</p>
                      
                      <div className="space-y-3 mb-8 flex-1">
                        {plan.features.map((f, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span className="text-[13px] text-muted-foreground font-medium">{f}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="w-full py-3 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-glow hover:scale-[1.02] transition-all"
                      >
                        Selecionar Plano
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // PASSO 2: Dados Bancários
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-3xl mx-auto space-y-6"
                >
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar aos planos
                  </button>

                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <selectedPlan.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Plano {selectedPlan.name}</h3>
                    <p className="text-xl font-black text-primary mt-1 text-muted-foreground">{selectedPlan.price} / mês</p>
                  </div>

                  <div className="p-8 rounded-2xl bg-secondary/30 border border-border">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">Informações para Pagamento</h4>
                        <p className="text-sm text-muted-foreground">Efetue a transferência para a conta abaixo</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm bg-background p-6 rounded-xl border border-border/50">
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">Banco</p>
                        <p className="font-medium">{bankConfig.bank}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">Beneficiário</p>
                        <p className="font-medium">{bankConfig.accountName}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">IBAN de Angola</p>
                        <p className="font-mono font-bold bg-muted p-3 rounded-lg border border-border select-all text-base">{bankConfig.iban}</p>
                      </div>
                      <div className="md:col-span-2 flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Sua Referência Única</p>
                          <p className="font-mono font-black text-foreground text-lg">{reference}</p>
                        </div>
                        <p className="text-xs text-muted-foreground text-right max-w-[150px]">Coloque esta referência no descritivo da transferência.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmTransfer}
                    className="w-full flex justify-center items-center gap-3 py-4 rounded-xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-glow hover:scale-[1.01] transition-all mt-4"
                  >
                    Já transferi, enviar comprovativo <Send className="w-4 h-4 inline-block" />
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
