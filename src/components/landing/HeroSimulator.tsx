import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MessageSquare, BarChart3, TrendingUp, ShieldCheck, Rocket, LayoutDashboard, Database } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'Boas-vindas',
    desc: 'O futuro da sua gestão comercial começa aqui.',
    icon: Rocket,
    color: 'text-neon',
    component: (
      <div className="relative w-full aspect-video glass-card rounded-3xl p-8 flex flex-col items-center justify-center gap-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        <Zap className="w-16 h-16 text-primary animate-bounce-slow" />
        <h3 className="text-2xl font-black uppercase italic tracking-widest text-white">CRM TOP</h3>
        <p className="text-white/60 text-sm text-center">Iniciando sistema de inteligência...</p>
      </div>
    )
  },
  {
    id: 2,
    title: 'Canais de Venda',
    desc: 'Centralize leads de todos os seus canais em tempo real.',
    icon: Database,
    color: 'text-purple-400',
    component: (
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        {['WhatsApp', 'Instagram', 'Landing', 'Manual'].map((site, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-4 rounded-2xl flex items-center gap-3 border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-primary" /></div>
            <span className="text-[10px] font-bold text-white/80">{site}</span>
          </motion.div>
        ))}
      </div>
    )
  },
  {
    id: 3,
    title: 'Configuração',
    desc: 'Personalize seu pipeline e regras de negócio.',
    icon: LayoutDashboard,
    color: 'text-blue-400',
    component: (
      <div className="relative w-full h-64 glass-card rounded-3xl p-6 overflow-hidden">
        <div className="flex gap-4 h-full">
          {[1,2,3].map(col => (
            <div key={col} className="flex-1 bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col gap-2">
              <div className="h-2 w-12 bg-white/20 rounded mb-2" />
              <div className="h-12 w-full bg-white/10 rounded-lg animate-pulse" />
              <div className="h-12 w-full bg-white/10 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: 'Chat IA',
    desc: 'Conversas inteligentes que convertem automaticamente.',
    icon: MessageSquare,
    color: 'text-emerald-400',
    component: (
      <div className="max-w-xs mx-auto glass-card rounded-3xl p-4 border-emerald-500/20">
        <div className="space-y-3">
          <div className="bg-white/10 rounded-2xl p-3 text-[10px] text-white/70 w-3/4">Olá! Tenho interesse no produto.</div>
          <div className="bg-primary/20 rounded-2xl p-3 text-[10px] text-white w-3/4 ml-auto border border-primary/30">
             <div className="flex items-center gap-1 mb-1 font-bold text-primary"><Zap className="w-3 h-3" /> BOT</div>
             Temos o item em stock! Gostaria de agendar uma entrega?
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: 'Dashboard',
    desc: 'Visualize lucros e KPIs em tempo real.',
    icon: BarChart3,
    color: 'text-neon-glow',
    component: (
      <div className="glass-card rounded-3xl p-6 w-full h-full relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20"><BarChart3 className="w-20 h-20 text-primary" /></div>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Lucro Total</p>
              <h2 className="text-3xl font-black text-white italic tracking-tighter">1.250.000 KZ</h2>
            </div>
            <div className="text-emerald-500 text-xs font-bold">+28%</div>
          </div>
          <div className="flex gap-1 h-20 items-end">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <motion.div 
                key={i} 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className="flex-1 bg-gradient-to-t from-primary to-transparent rounded-t-full" 
              />
            ))}
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: 'Sucesso',
    desc: 'Sua empresa escalando para o próximo nível.',
    icon: ShieldCheck,
    color: 'text-neon',
    component: (
      <div className="text-center p-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="relative inline-block"
        >
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-primary/30 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
        </motion.div>
        <h4 className="mt-6 text-xl font-black text-white uppercase italic tracking-widest">Escala Ativada</h4>
        <p className="text-xs text-white/60 mt-2">Tecnologia Top IA protegendo seus dados.</p>
      </div>
    )
  }
];

export const HeroSimulator = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-lg lg:max-w-xl">
      <div className="relative mb-12 h-80 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 1.1, x: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="w-full"
          >
            {steps[currentStep].component}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentStep ? 'w-full bg-primary shadow-glow' : 'w-full bg-white/10'
            }`}
          />
        ))}
      </div>
      
      <div className="mt-6 text-center lg:text-left min-h-[80px]">
        {(() => {
          const Icon = steps[currentStep].icon;
          return (
            <motion.h4 
              key={`title-${currentStep}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-black text-white uppercase italic tracking-wider flex items-center gap-2 justify-center lg:justify-start"
            >
              <Icon className={`w-5 h-5 ${steps[currentStep].color}`} />
              {steps[currentStep].title}
            </motion.h4>
          );
        })()}
        <motion.p 
          key={`desc-${currentStep}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-white/50 text-xs font-medium mt-1 uppercase tracking-widest leading-relaxed"
        >
          {steps[currentStep].desc}
        </motion.p>
      </div>
    </div>
  );
};
