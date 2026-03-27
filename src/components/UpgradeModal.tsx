import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Rocket, Diamond, Zap, Building2, ArrowLeft, Send, Loader2, FileText, Upload } from 'lucide-react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setUploadFile(file);
  };

  const handleSubmitPayment = async () => {
    if (!selectedPlan || !uploadFile) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: member } = await (supabase as any).from('usuarios_loja').select('loja_id').eq('user_id', user.id).single();
      if (!member) throw new Error("Loja não encontrada");

      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}-${member.loja_id}.${fileExt}`;
      const filePath = `comprovativos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const { data: pData } = await (supabase as any)
        .from('planos')
        .select('id')
        .ilike('name', selectedPlan.id)
        .single();

      await (supabase as any).from('assinaturas').insert({
        loja_id: member.loja_id,
        plano_id: pData?.id,
        status: 'aguardando_pagamento',
        comprovativo_url: publicUrl,
        data_inicio: new Date().toISOString(),
        notas: `Pagamento de plano ${selectedPlan.name} via transferência. Ref: ${reference}`
      });

      setUploadComplete(true);
      
      const message = `Olá! Fiz o upload do comprovativo (PDF) para o plano *${selectedPlan.name}* no sistema. Ref: ${reference}`;
      window.open(`https://wa.me/351936179188?text=${encodeURIComponent(message)}`, '_blank');
      
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error: any) {
      alert("Erro no upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setUploadFile(null);
    setUploadComplete(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-card rounded-[32px] shadow-2xl overflow-hidden border border-border/50">
            {/* Header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Explorar Planos</h2>
                <p className="text-xs text-muted-foreground mt-1">Upgrade imediato para o seu negócio</p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              {!selectedPlan ? (
                <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {plans.map((plan) => (
                    <motion.button 
                      key={plan.id} 
                      whileHover={{ scale: 1.01 }} 
                      whileTap={{ scale: 0.99 }} 
                      onClick={() => setSelectedPlan(plan)} 
                      className="group p-4 rounded-3xl border border-border/50 bg-secondary/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-${plan.color}/10 text-${plan.color}`}>
                          <plan.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground">{plan.name}</h3>
                          <p className="text-[10px] text-muted-foreground uppercase font-black">{plan.features[0]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-foreground">{plan.price}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">por mês</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedPlan(null)} className="p-2 rounded-xl bg-secondary text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
                    <div>
                      <h3 className="font-bold text-foreground">Pagamento: {selectedPlan.name}</h3>
                      <p className="text-xs text-primary font-bold">{selectedPlan.price}</p>
                    </div>
                  </div>

                  <div className="glassmorphism p-5 rounded-3xl border-primary/20 space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                      <Building2 className="w-5 h-5" />
                      <p className="text-xs font-bold uppercase tracking-widest">Coordenadas Bancárias</p>
                    </div>
                    {loadingConfig ? (
                       <div className="flex items-center justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                           <div><p className="text-[9px] uppercase font-bold text-muted-foreground">Banco</p><p className="text-[11px] font-bold text-foreground">{bankConfig.bank}</p></div>
                           <div><p className="text-[9px] uppercase font-bold text-muted-foreground">Titular</p><p className="text-[11px] font-bold text-foreground line-clamp-1">{bankConfig.accountName}</p></div>
                        </div>
                        <div className="bg-background/50 p-3 rounded-xl border border-border/50 text-center">
                          <p className="text-[9px] uppercase font-black text-primary mb-1 tracking-widest">IBAN</p>
                          <p className="text-[12px] font-mono font-black text-foreground break-all">{bankConfig.iban}</p>
                        </div>
                        <div className="bg-primary/10 p-2 rounded-xl text-center">
                           <p className="text-[10px] font-bold text-primary">REF: <span className="font-black select-all">{reference}</span></p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Anexar Comprovativo (PDF)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        onChange={handleFileUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full py-6 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${uploadFile ? 'border-primary bg-primary/5' : 'border-border/60 group-hover:border-primary/40'}`}>
                        {uploadFile ? (
                           uploadFile.type === 'application/pdf' ? <FileText className="w-6 h-6 text-primary" /> : <Upload className="w-6 h-6 text-primary" />
                        ) : (
                           <Upload className="w-6 h-6 text-muted-foreground" />
                        )}
                        <p className="text-[11px] font-bold text-foreground text-center px-4 line-clamp-1">
                          {uploadFile ? uploadFile.name : 'Clique ou arraste o PDF aqui'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitPayment}
                    disabled={!uploadFile || isUploading || uploadComplete}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-glow transition-all flex items-center justify-center gap-2 ${uploadComplete ? 'bg-emerald-500 text-white' : 'bg-primary text-white disabled:opacity-50'}`}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : uploadComplete ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    {uploadComplete ? 'ENVIADO COM SUCESSO' : 'FINALIZAR UPGRADE'}
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
