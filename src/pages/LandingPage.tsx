import { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import UpgradeModal from '@/components/UpgradeModal';
import { 
  Zap, ChevronRight, LayoutDashboard, BarChart3, Users, 
  MessageSquare, ShieldCheck, Rocket, Globe, Database, 
  CheckCircle2, ArrowRight, Building2, MousePointer2,
  Lock, Cpu, Sparkles
} from 'lucide-react';

import { CursorParticles } from '@/components/landing/CursorParticles';
import { HeroSimulator } from '@/components/landing/HeroSimulator';
import { PricingCard } from '@/components/landing/PricingCard';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.95]);

  const features = [
    {
      title: 'Hiper-Automação',
      desc: 'Algoritmos de IA que gerenciam seus leads 24/7 sem intervenção humana.',
      icon: Cpu,
      accent: 'text-primary'
    },
    {
      title: 'Segurança Militar',
      desc: 'Dados criptografados em infraestrutura redundante Top IA.',
      icon: Lock,
      accent: 'text-purple-400'
    },
    {
      title: 'Omnichannel Real',
      desc: 'Integração fluida entre WhatsApp, Instagram e CRM em uma única tela.',
      icon: Globe,
      accent: 'text-blue-400'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F12] text-white selection:bg-primary/30 overflow-x-hidden font-sans">
      <CursorParticles />
      
      {/* Navigation - Glassmorphism */}
      <header className="fixed top-0 left-0 w-full z-[100] backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow group-hover:rotate-12 transition-transform">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <span className="font-black text-2xl tracking-tighter italic uppercase text-white">CRM TOP</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-10">
            {['Funcionalidades', 'Planos', 'Sobre'].map((item) => (
              <button 
                key={item}
                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors"
              >
                {item}
              </button>
            ))}
            <Link to="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-secondary transition-colors">Entrar</Link>
            <button 
              onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2.5 rounded-xl bg-primary text-black font-black text-[10px] uppercase tracking-widest shadow-glow hover:scale-[1.05] transition-all"
            >
              Começar Agora
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-48 pb-24 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              style={{ opacity, scale }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Next-Gen AI Business
              </div>
              <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.85] italic uppercase">
                A Elite da <span className="text-primary italic">Automação</span> Comercial
              </h1>
              <p className="text-lg lg:text-xl text-white/50 mb-12 leading-relaxed font-medium max-w-lg">
                O único ecossistema inteligente em Angola e Portugal projetado para dominar o mercado com IA e organização absoluta.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5">
                <button 
                  onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative px-10 py-5 rounded-2xl bg-primary text-black font-black text-xs uppercase tracking-[0.2em] shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  <span className="relative flex items-center justify-center gap-3">
                    Ativar Agora
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                <button 
                  onClick={() => document.getElementById('funcionalidades')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-10 py-5 rounded-2xl bg-white/5 text-white font-black text-xs uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
                >
                  Explorar Tech
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-20 bg-primary/20 blur-[120px] rounded-full opacity-30 animate-pulse" />
              <div className="relative z-10 glass-card rounded-[48px] p-6 lg:p-10 border-white/10 shadow-2xl">
                <HeroSimulator />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stacks / Features */}
      <section id="funcionalidades" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24 max-w-3xl mx-auto">
             <h2 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic mb-6">Inovação Sem Limites</h2>
             <p className="text-white/40 text-lg uppercase tracking-widest font-bold italic">Processamento em Tempo Real • IA Generativa • Escala Global</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -12, scale: 1.02 }}
                className="glass-card-neon p-10 rounded-[40px] flex flex-col group transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-black transition-all">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-4">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed font-medium mb-12">{f.desc}</p>
                <div className="mt-auto flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest">
                  Ver Documentação <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visualizer - Full Width Parallax */}
      <section className="py-32 bg-black/40 border-y border-white/5 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
               <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl opacity-50 transition-opacity group-hover:opacity-100" />
                  <div className="relative glass-card rounded-[40px] overflow-hidden border-white/20">
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                      alt="Analytics interface" 
                      className="w-full opacity-60 grayscale hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F12] via-transparent to-transparent" />
                  </div>
               </div>
            </motion.div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic mb-8 leading-none">Visão Holística do seu Negócio</h2>
              <p className="text-white/50 text-xl font-medium mb-10 leading-relaxed italic">
                Dashboards preditivos que antecipam tendências e sugerem ações estratégicas antes mesmo de você precisar.
              </p>
              <div className="space-y-6">
                {[
                  { title: 'IA Preditiva', icon: Rocket },
                  { title: 'Faturamento Real-time', icon: BarChart3 },
                  { title: 'Gestão de Talentos', icon: Users }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold uppercase tracking-widest">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Premium Cards */}
      <section id="planos" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl lg:text-7xl font-black tracking-tighter uppercase italic mb-6">Investimento em Elite</h2>
            <p className="text-white/40 text-lg uppercase tracking-widest font-black italic">Escala Linear • Sem Custos Ocultos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <PricingCard 
              name="Starter"
              price="15.000 Kz"
              features={['Gestão de leads básica', 'Pipeline inteligente', 'Supote via chat']}
              cta="Ativar Agora"
            />
            <PricingCard 
              name="Starter Plus"
              price="30.000 Kz"
              features={['Tudo no Starter', 'Automação via n8n', 'Relatórios semanais']}
              cta="Solicitar Acesso"
            />
            <PricingCard 
              name="Profissional"
              price="50.000 Kz"
              features={['Tudo no Starter Plus', 'Gestão de equipas', 'IA de conversação ativa', 'Domínio Customizado']}
              cta="Plano Elite"
              popular
              highlight
            />
            <PricingCard 
              name="Enterprise"
              price="100.000 Kz"
              features={['Infraestrutura Dedicada', 'SLA de 99.9%', 'Suporte 24/7 Premium', 'Consultoria Top IA']}
              cta="Falar com Especialista"
            />
          </div>
        </div>
      </section>

      {/* Institutional About */}
      <section id="sobre" className="py-32 border-t border-white/5 bg-black/20">
        <div className="container mx-auto px-6">
           <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-8">Criado pela <span className="text-primary italic">Top IA</span></h2>
                <p className="text-white/50 text-lg leading-relaxed mb-10 font-medium">
                   O <span className="text-white font-bold italic">CRM TOP</span> nasceu de uma visão disruptiva em Portugal: simplificar a tecnologia de ponta para elevar o padrão comercial em Angola. Somos engenheiros focados em performance, automação e sucesso absoluto do cliente.
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100"><img src="https://flagcdn.com/w20/pt.png" alt="PT" className="w-6" /></div>
                  <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center grayscale hover:grayscale-0 transition-all opacity-50 hover:opacity-100"><img src="https://flagcdn.com/w20/ao.png" alt="AO" className="w-6" /></div>
                </div>
              </div>
              <div className="relative">
                 <div className="absolute -inset-10 bg-secondary/10 blur-[80px] rounded-full animate-pulse" />
                 <div className="glass-card p-12 rounded-[56px] text-center relative z-10 border-white/5">
                    <Building2 className="w-16 h-16 text-secondary mx-auto mb-8" />
                    <h4 className="text-xl font-black uppercase italic tracking-widest mb-4">Sede em Portugal</h4>
                    <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Inovação Europeia • Escala Africana</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent animate-pulse" />
        <div className="container mx-auto px-6 text-center relative z-10 text-black">
          <h2 className="text-5xl lg:text-9xl font-black tracking-tighter uppercase italic mb-12 leading-none">Domine o seu Mercado</h2>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-20 py-8 rounded-[32px] bg-black text-primary font-black text-lg uppercase tracking-[0.3em] shadow-2xl flex items-center gap-4 mx-auto transition-transform"
          >
            Ativar Sistema
            <Zap className="w-8 h-8 fill-primary" />
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><Zap className="w-5 h-5 text-primary shadow-glow" /></div>
            <span className="font-black text-xl tracking-tighter italic uppercase text-white">CRM TOP</span>
          </div>
          <div className="text-center md:text-right">
              <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em] mb-3">
                &copy; 2026 CRM TOP &bull; Powered by Top IA Group
              </p>
              <div className="flex gap-6 justify-center md:justify-end text-[10px] font-black uppercase tracking-widest text-white/50">
                <a href="#" className="hover:text-primary">Termos</a>
                <a href="#" className="hover:text-primary">Privacidade</a>
                <a href="mailto:geral@topia.solutions" className="text-primary hover:underline">Support Hub</a>
              </div>
          </div>
        </div>
      </footer>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
}
