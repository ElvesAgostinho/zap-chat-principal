import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Menu, X, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { name: 'Início', href: '#' },
    { name: 'Funcionalidades', href: '#features' },
    { name: 'Planos de Elite', href: '#pricing' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled ? 'py-4 bg-[#0B0F12]/80 backdrop-blur-xl border-b border-white/5' : 'py-8 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* LOGO */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-glow">
            <Zap className="w-6 h-6 text-primary fill-current" />
          </div>
          <span className="text-xl font-black uppercase italic tracking-widest text-white">CRM TOP</span>
        </a>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-12">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50 hover:text-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="px-6 py-2.5 rounded-full glass-card border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary hover:text-black transition-all flex items-center gap-2 outline-none">
                Dashboard <User className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0B0F12] border-white/10 text-white rounded-2xl w-56 p-2 z-[200]">
                <DropdownMenuItem asChild className="hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer rounded-xl font-bold p-0 mb-1">
                  <Link to="/admin" className="w-full h-full px-3 py-3 flex items-center gap-3 text-[11px] uppercase tracking-wider">
                    <User className="w-4 h-4" /> Ir para Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="hover:bg-red-500/20 hover:text-red-500 text-white/70 transition-colors cursor-pointer rounded-xl font-bold px-3 py-3 flex items-center gap-3 text-[11px] uppercase tracking-wider"
                  onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
                >
                  <LogOut className="w-4 h-4" /> Terminar Sessão
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link 
              to="/login" 
              className="px-6 py-2.5 rounded-full glass-card border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary hover:text-black transition-all flex items-center gap-2"
            >
              Área Restrita
            </Link>
          )}
        </nav>

        {/* MOBILE TOGGLE */}
        <button 
          className="lg:hidden w-10 h-10 flex items-center justify-center text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#0B0F12] border-b border-white/10 p-6 lg:hidden z-50 shadow-2xl"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-primary"
                >
                  {link.name}
                </a>
              ))}
              {user ? (
                <>
                  <Link 
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4" /> Aceder Dashboard
                  </Link>
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      supabase.auth.signOut().then(() => navigate('/'));
                    }}
                    className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-xs font-black uppercase tracking-widest text-red-500 flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Terminar Sessão
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs font-black uppercase tracking-widest text-white"
                >
                  Área Restrita
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
