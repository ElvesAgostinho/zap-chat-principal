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
    <div className="force-dark min-h-screen bg-[#0B0F14] text-white selection:bg-primary/30 selection:text-white overflow-x-hidden pt-[80px]">
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
        className="fixed bottom-24 right-8 z-[2000] w-[60px] h-[60px] bg-[#22C55E] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all group"
      >
        <MessageCircle className="w-8 h-8 text-white fill-current" />
        <span className="absolute right-full mr-4 px-4 py-2 bg-white text-black text-[10px] font-bold uppercase rounded-xl tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Falar com Especialista
        </span>
      </motion.a>
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-[140px] pb-32 px-6 lg:px-12 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] items-center gap-[64px]">
          
          {/* Text Content */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
             className="flex flex-col items-start text-left max-w-[640px]"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary fill-current" />
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary/90">Tecnologia Inteligente Ativa</span>
            </div>

            <h1 className="text-4xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-white">
              Venda mais com <span className="text-primary">automação inteligente</span> no WhatsApp
            </h1>

            <p className="text-lg lg:text-xl leading-relaxed text-slate-400 font-medium mb-12">
              A plataforma definitiva para empresas que buscam escala. Atendimento, qualificação e agendamentos 100% automáticos.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto mb-12">
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-4 rounded-xl bg-primary text-black text-base font-bold flex items-center justify-center gap-2 shadow-[0_8px_30px_rgb(34,197,94,0.3)] hover:-translate-y-1 transition-all duration-200"
              >
                Começar agora <ChevronRight className="w-5 h-5" />
              </a>
              <a 
                href="#features"
                className="px-10 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-base font-bold hover:bg-white/10 transition-all duration-200"
              >
                Conhecer plataforma
              </a>
            </div>

            <div className="flex items-center gap-3 py-2 border-t border-white/5 w-full">
               <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0F14] bg-slate-800" />)}
               </div>
               <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                 +10.000 leads processados com automação real
               </p>
            </div>
          </motion.div>

          {/* Visual Content (Mock UI) */}
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="relative"
          >
            <div className="relative z-10 p-4 rounded-2xl bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-sm">
                <HeroSimulator />
                {/* Subtle Glow */}
                <div className="absolute -inset-24 bg-primary/20 blur-[120px] -z-10 rounded-full opacity-50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-40 px-6 lg:px-12 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold tracking-tight mb-6">Escalabilidade <span className="text-primary">em cada etapa</span></h2>
            <p className="text-slate-400 text-lg">Tudo o que você precisa para transformar conversas em lucro previsível.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: MessageCircle, title: 'IA Qualificadora', desc: 'Atendimento 24/7 que qualifica leads e fecha vendas de forma autônoma.' },
            { icon: Calendar, title: 'Agendamento Direto', desc: 'Sincronização inteligente para marcar serviços sem interação humana.' },
            { icon: TrendingUp, title: 'Pipeline Visual', desc: 'Gestão clara de cada oportunidade no seu funil de vendas Enterprise.' },
            { icon: BarChart3, title: 'Analytics Real', desc: 'Dashboards precisos sobre conversão, tempo de resposta e ROI.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-2 h-full"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-8 group-hover:bg-primary transition-all duration-300">
                <item.icon className="w-6 h-6 text-primary group-hover:text-black" />
              </div>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
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
                planId="starter"
                features={['Até 200 Leads ativos', 'Vitrine Personalizada', 'Gestão de Pedidos', '2 Atendentes', 'Relatórios Básicos']}
                cta="Começar no Starter"
              />
              <PricingCard 
                name="Profissional"
                price="50.000 Kz"
                planId="profissional"
                popular={true}
                highlight={true}
                features={['Leads Ilimitados', 'BI & Relatórios de Lucro', 'Exportação de Dados', 'Até 5 Atendentes', 'Automações de Pós-Venda']}
                cta="Turbinar agora"
              />
              <PricingCard 
                name="Enterprise"
                price="100.000 Kz"
                planId="enterprise"
                features={['Tudo do Profissional', 'Atendentes Ilimitados', 'Domínio Customizado', 'API de Integração', 'Gerente Dedicado']}
                cta="Escolher Enterprise"
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
              <li><Link to="/login" className="hover:text-primary transition-colors">Área Restrita</Link></li>
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
