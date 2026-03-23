import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const images = [
  {
    url: '/assets/images/hero_smiling.png',
    alt: 'Empreendedores angolanos sorridentes colaborando'
  },
  {
    url: '/assets/images/hero_office.png',
    alt: 'Escritório moderno com tecnologia CRM'
  },
  {
    url: '/assets/images/hero_success.png',
    alt: 'Sucesso nas vendas com interface intuitiva'
  }
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={images[index].url}
          alt={images[index].alt}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>
      
      {/* Overlay for better text contrast if needed */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      
      {/* Progress Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
        {images.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full bg-white transition-all cursor-pointer ${i === index ? 'w-10 opacity-100' : 'w-2 opacity-40'}`}
            onClick={() => setIndex(i)}
            whileHover={{ opacity: 0.8 }}
          />
        ))}
      </div>
    </div>
  );
}
