import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Mail, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function WhatsAppSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Se o utilizador estiver logado, não mostramos o widget flutuante
  if (user) return null;

  const whatsappNumber = "351936179188";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Olá,%20preciso%20de%20ajuda%20com%20o%20CRM.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 bg-white rounded-2xl shadow-elevated border border-slate-200 overflow-hidden w-72"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
              <h3 className="font-bold text-lg">Suporte Topia</h3>
              <p className="text-emerald-50 text-xs mt-1">Como podemos ajudar-te hoje?</p>
            </div>
            
            <div className="p-4 space-y-4">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors group"
              >
                <div className="bg-emerald-500 text-white p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">WhatsApp</p>
                  <p className="text-sm font-medium">+351 936179188</p>
                </div>
              </a>

              <a 
                href="mailto:geral@topconsultores.pt" 
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <div className="bg-slate-200 text-slate-600 p-2 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium">geral@topconsultores.pt</p>
                </div>
              </a>

              <a 
                href="https://www.topia.solutions" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <div className="bg-slate-200 text-slate-600 p-2 rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Site</p>
                  <p className="text-sm font-medium">www.topia.solutions</p>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
      </motion.button>
    </div>
  );
}
