import React from 'react';
import { motion } from 'framer-motion';
import { Zap, MessageSquare, BarChart3, TrendingUp, ShieldCheck, Rocket, ChevronRight, Globe, Instagram, Mail, Phone, MessageCircle, Calendar } from 'lucide-react';
import { CursorParticles } from '../components/landing/CursorParticles';
import { HeroSimulator } from '../components/landing/HeroSimulator';
import { PricingCard } from '../components/landing/PricingCard';
import { Header } from '../components/landing/Header';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const whatsappNumber = "351936179188";
  const whatsappLink = `https://wa.me/${whatsappNumber}`;
  const companyEmail = "geral@topia.solutions";

  return (
    <div className="min-h-screen bg-[#0B0F12] text-white selection:bg-primary/30 selection:text-primary overflow-x-hidden pt-[80px]">
      <CursorParticles />
      <Header />
      
      {/* Floating WhatsApp Bot */}
      <motion.a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-8 right-8 z-[150] w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,211,102,0.4)] transition-all group"
      >
        <MessageCircle className="w-8 h-8 text-white fill-current" />
        <span className="absolute right-full mr-4 px-4 py-2 bg-white text-black text-[10px] font-black uppercase rounded-xl tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Falar com Especialista
        </span>
      </motion.a>
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-[120px] pb-24 px-6 lg:px-12 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] items-center gap-[80px]">
          
          {/* Text Content */}
          <motion.div 
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="flex flex-col items-start text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-neon/20 mb-8 animate-pulse shrink-0">
                <Zap className="w-4 h-4 text-primary fill-current" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Tecnologia Top IA ativa</span>
            </div>

            <h1 className="font-black italic uppercase tracking-tighter leading-[1.02] mb-6 text-white" 
                style={{ fontSize: 'clamp(2.5rem, 5vw + 1rem, 5rem)' }}>
              Gerencie clientes e automatize o seu negócio <span className="text-primary italic">com inteligência</span>
            </h1>

            <p className="text-[1.125rem] leading-[1.6] text-[#E5E7EB] font-medium max-w-2xl mb-12">
              CRM desenvolvido pela Top IA para empresas que querem escalar com automação real de WhatsApp e agendamentos inteligentes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-[14px] rounded-full bg-primary text-black text-[17px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all"
              >
                Começar agora <Zap className="w-5 h-5 fill-current" />
              </a>
              <a 
                href="#features"
                className="px-8 py-[14px] rounded-full glass-card text-white text-[17px] font-semibold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all"
              >
                Conhecer mais <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Visual Content (Simulator) */}
          <motion.div 
             initial={{ opacity: 0, x: 30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="relative flex items-center justify-center"
          >
            <HeroSimulator />
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-32 px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
            <h2 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter mb-6">Funcionalidades <span className="text-primary">Indispensáveis</span></h2>
            <div className="h-1 w-24 bg-primary mx-auto rounded-full shadow-glow" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: MessageCircle, title: 'Automação WhatsApp', desc: 'Sua IA atende, qualifica e vende direto no seu WhatsApp 24/7.' },
            { icon: Calendar, title: 'Agendamento Smart', desc: 'Marque reuniões e serviços de forma automática sem erros ou conflitos.' },
            { icon: TrendingUp, title: 'Gestão de Leads', desc: 'Pipeline visual para organizar cada etapa do seu funil de vendas.' },
            { icon: BarChart3, title: 'Análise de ROI', desc: 'Saiba exatamente quanto de lucro cada automação está a gerar para o negócio.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-10 rounded-[40px] hover:border-primary/50 transition-all group hover:-translate-y-2 shrink-0 h-full"
            >
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-black transition-all">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold uppercase italic tracking-tight mb-4">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-32 bg-white/5 relative z-10 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter mb-4">Investimento em <span className="text-primary text-glow">Elite</span></h2>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Escala comercial real com o melhor ROI do mercado</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PricingCard 
                name="Starter"
                price="25.000 Kz"
                features={['1 Usuário', '500 Leads/mês', 'Automação WhatsApp Base', 'Acesso ao CRM', 'Suporte Via Email']}
                cta="Escolher Starter"
              />
              <PricingCard 
                name="Profissional"
                price="50.000 Kz"
                popular={true}
                highlight={true}
                features={['5 Usuários', '2.000 Leads/mês', 'Agendamento Automático', 'IA Treinada', 'Suporte Prioritário']}
                cta="Turbinar agora"
              />
              <PricingCard 
                name="Expert"
                price="100.000 Kz"
                isWhatsApp={true}
                features={['Usuários Ilimitados', 'Leads Ilimitados', 'Consultoria Dedicada', 'IA Totalmente Customizada', 'Estratégia de Escala']}
                cta="Falar com especialista"
              />
            </div>
        </div>
      </section>

      {/* --- CONTACT & FOOTER --- */}
      <footer className="pt-32 pb-12 px-6 lg:px-12 bg-[#0B0F12] relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24 border-t border-white/5 pt-24">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-primary shadow-glow" />
                <span className="text-2xl font-black uppercase italic tracking-widest">CRM TOP</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Elevando a inteligência comercial de empresas focadas em escala através de automação de alta performance.
            </p>
            <div className="flex gap-4">
               <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-primary hover:text-black transition-all opacity-50 hover:opacity-100">
                  <Instagram className="w-5 h-5" />
               </a>
               <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-primary hover:text-black transition-all opacity-50 hover:opacity-100">
                  <MessageCircle className="w-5 h-5" />
               </a>
               <a href="#" className="w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-primary hover:text-black transition-all opacity-50 hover:opacity-100">
                  <Globe className="w-5 h-5" />
               </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase italic tracking-widest mb-8 text-white">Navegação</h4>
            <ul className="space-y-4 text-white/50 text-sm font-medium">
              <li><a href="#" className="hover:text-primary transition-colors">Início</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Planos de Elite</a></li>
              <li><Link to="/auth" className="hover:text-primary transition-colors">Área Restrita</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase italic tracking-widest mb-8 text-white">Contactos</h4>
            <ul className="space-y-4 text-white/50 text-sm font-medium">
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary" />
                <span>{companyEmail}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary" />
                <span>+351 936179188</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>Suporte Via WhatsApp</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-8 rounded-3xl border-primary/20">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">News Inovação</h4>
            <p className="text-[10px] text-white/40 mb-6 uppercase leading-relaxed">Insights de automação enviados para o seu e-mail corporativo.</p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `mailto:${companyEmail}?subject=Subscrição Newsletter&body=Gostaria de subscrever a News Inovação.`;
              }}
              className="flex flex-col gap-2"
            >
               <input type="email" placeholder="EMAIL" required className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] focus:outline-none focus:border-primary/50 text-white" />
               <button type="submit" className="bg-primary text-black font-black uppercase text-[10px] py-3 rounded-full shadow-glow">Subscrever</button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-white/5 pt-12 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
            © 2026 TOP IA SOLUTIONS • PORTUGAL & ANGOLA • TODOS OS DIREITOS RESERVADOS
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
