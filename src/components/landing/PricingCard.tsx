import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Zap, MessageCircle, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
  highlight?: boolean;
  isWhatsApp?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  name, price, features, cta, popular, highlight, isWhatsApp
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || showBankDetails) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleAction = () => {
    if (isWhatsApp) {
      window.open('https://wa.me/351936179188', '_blank');
    } else {
      setShowBankDetails(true);
    }
  };

  const copyIBAN = () => {
    navigator.clipboard.writeText('AO06 0000 0000 0000 0000 0'); // Placeholder Real IBAN
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative group h-full`}
    >
      <div 
        className={`
          relative h-full flex flex-col p-8 rounded-2xl border transition-all duration-300
          ${highlight 
            ? 'border-primary/40 bg-primary/[0.03] shadow-[0_0_40px_rgba(34,197,94,0.05)]' 
            : 'border-white/5 bg-white/[0.02]'}
          hover:border-primary/50 group-hover:translate-y-[-4px]
        `}
      >
        <div className="flex flex-col h-full">
              {popular && (
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-bold uppercase tracking-wider z-10">
                  Mais Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-2">{name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight">{price}</span>
                  {price.includes('Kz') && <span className="text-xs text-slate-500 font-medium">/mês</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-400">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-primary' : 'text-slate-600'}`} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Dialog open={showBankDetails} onOpenChange={setShowBankDetails}>
                <DialogTrigger asChild>
                  <button 
                    onClick={handleAction}
                    className={`
                      w-full py-4 rounded-xl font-bold text-sm transition-all
                      ${highlight 
                        ? 'bg-primary text-black shadow-[0_10px_30px_rgba(34,197,94,0.2)] hover:scale-[1.02]' 
                        : 'bg-white/5 text-white hover:bg-white/10'}
                      flex items-center justify-center gap-2 group/btn
                    `}
                  >
                    <span className="flex items-center gap-2">
                      {cta}
                      {isWhatsApp ? (
                        <MessageCircle className="w-4 h-4" />
                      ) : (
                        <Zap className={`w-4 h-4 transition-transform group-hover/btn:rotate-12 ${highlight ? 'fill-current' : ''}`} />
                      )}
                    </span>
                  </button>
                </DialogTrigger>
                
                <DialogContent className="max-w-md bg-[#0B0F12] border-white/10 p-8 pt-12 overflow-hidden rounded-[30px] z-[200]">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center text-center relative z-10"
                  >
                    <BuildingBankIcon className="w-12 h-12 text-primary mb-6" />
                    <h4 className="text-lg font-black uppercase italic text-white mb-2">Dados para Pagamento</h4>
                    <p className="text-xs text-white/50 mb-8 max-w-[250px]">Realize a transferência e envie o comprovativo.</p>
                    
                    <div className="w-full space-y-3 mb-8">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                        <p className="text-[10px] text-white/30 uppercase font-black mb-1">IBAN (BAI)</p>
                        <div className="flex items-center justify-between gap-2">
                          <code className="text-[10px] font-mono text-white/90 break-all leading-tight">AO06 0000 0000 0000 0000 0</code>
                          <button onClick={copyIBAN} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-white/40" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left">
                        <p className="text-[10px] text-white/30 uppercase font-black mb-1">Titular</p>
                        <p className="text-[10px] font-bold text-white/90">TOP IA SOLUTIONS</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setShowBankDetails(false);
                        window.open(`https://wa.me/351936179188?text=Olá, acabei de realizar o pagamento para o plano ${name}. Segue o comprovativo.`, '_blank');
                      }}
                      className="w-full py-4 rounded-full bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-glow"
                    >
                      Confirmar no WhatsApp <MessageCircle className="w-4 h-4" />
                    </button>
                  </motion.div>
                </DialogContent>
              </Dialog>
        </div>
      </div>
    </motion.div>
  );
};

const BuildingBankIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21h18" />
    <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
    <path d="M5 21V10.85" />
    <path d="M19 21V10.85" />
    <path d="M9 21v-4a2 2 0 0 1 4 0v4" />
  </svg>
);
