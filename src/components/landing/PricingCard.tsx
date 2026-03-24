import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CheckCircle2, Zap } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
  highlight?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({ 
  name, price, features, cta, popular, highlight 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
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
          relative h-full flex flex-col p-8 rounded-[40px] border transition-all duration-500
          ${highlight 
            ? 'border-primary shadow-glow animate-pulse-neon bg-primary/5' 
            : 'border-white/10 bg-white/5 backdrop-blur-xl'}
          group-hover:border-primary/50 group-hover:scale-[1.02]
        `}
      >
        {popular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-glow">
            Recomendado
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-2">{name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-white tracking-tighter">{price}</span>
            {price.includes('Kz') && <span className="text-xs text-white/40 font-bold uppercase tracking-widest">/mês</span>}
          </div>
        </div>

        <ul className="space-y-4 mb-10 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-medium text-white/70">
              <CheckCircle2 className={`w-4 h-4 ${highlight ? 'text-primary' : 'text-primary/50'}`} />
              {f}
            </li>
          ))}
        </ul>

        <button 
          className={`
            w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all
            ${highlight 
              ? 'bg-primary text-black shadow-glow hover:bg-white' 
              : 'bg-white/10 text-white hover:bg-white hover:text-black'}
            flex items-center justify-center gap-2 group/btn
          `}
        >
          {cta}
          <Zap className={`w-4 h-4 transition-transform group-hover/btn:rotate-12 ${highlight ? 'fill-black' : ''}`} />
        </button>
      </div>

      {/* 3D Content Layer */}
      <div 
        style={{ transform: "translateZ(50px)" }}
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {/* Decorative elements that float in 3D space */}
      </div>
    </motion.div>
  );
};
