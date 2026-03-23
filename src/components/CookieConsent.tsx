import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, CheckCircle2 } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-[100]"
        >
          <div className="bg-card border border-border rounded-[32px] p-6 shadow-elevated relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Cookie className="w-24 h-24 text-primary rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Cookie className="w-6 h-6" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-tighter italic">Nossa Política de Cookies</h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-medium">
                Utilizamos cookies para melhorar sua experiência de navegação, analisar o tráfego e personalizar conteúdos de acordo com as diretrizes da <span className="text-foreground font-bold">Top IA</span>. Ao continuar, você concorda com nosso uso de tecnologias de rastreamento.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleAccept}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-glow hover:scale-[1.02] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Aceitar Tudo
                </button>
                <button
                  onClick={handleDecline}
                  className="px-6 py-3 rounded-2xl bg-secondary text-foreground font-black text-[10px] uppercase tracking-widest border border-border hover:bg-muted transition-colors"
                >
                  Recusar
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
