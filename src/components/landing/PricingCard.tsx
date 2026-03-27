import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CheckCircle2, Zap, MessageCircle } from 'lucide-react';
import UpgradeModal from '@/components/UpgradeModal';

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
  highlight?: boolean;
  isWhatsApp?: boolean;
  planId?: string;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  name, price, features, cta, popular, highlight, isWhatsApp, planId
}) => {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  // 3D Tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleAction = () => {
    if (isWhatsApp) {
      window.open('https://wa.me/351936179188', '_blank');
    } else {
      setUpgradeOpen(true);
    }
  };

  return (
    <>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative group h-full"
      >
        <div className={`
          relative h-full flex flex-col p-8 rounded-2xl border transition-all duration-300
          ${highlight
            ? 'border-primary/40 bg-primary/[0.03] shadow-[0_0_40px_rgba(34,197,94,0.05)]'
            : 'border-white/5 bg-white/[0.02]'}
          hover:border-primary/50 group-hover:translate-y-[-4px]
        `}>
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
            {cta}
            {isWhatsApp
              ? <MessageCircle className="w-4 h-4" />
              : <Zap className={`w-4 h-4 transition-transform group-hover/btn:rotate-12 ${highlight ? 'fill-current' : ''}`} />
            }
          </button>
        </div>
      </motion.div>

      {/* Shared UpgradeModal — same as internal CRM */}
      <UpgradeModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  );
};
