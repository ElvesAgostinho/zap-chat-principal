import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import UpgradeModal from '@/components/UpgradeModal';
import { 
  Zap, ChevronRight, LayoutDashboard, BarChart3, Users, 
  MessageSquare, ShieldCheck, Rocket, Globe, Database, 
  CheckCircle2, ArrowRight, Building2, MousePointer2 
} from 'lucide-react';

import dashboardImg from '@/assets/mockups/dashboard.png';
import leadsImg from '@/assets/mockups/leads.png';
import automationImg from '@/assets/mockups/automation.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const features = [
    {
      title: 'Gestão de Leads',
      desc: 'Organize seus contatos de forma profissional e nunca perca uma oportunidade.',
      icon: Users,
      img: leadsImg
    },
    {
      title: 'Pipeline de Vendas',
      desc: 'Visualize o progresso de cada negócio em um funil intuitivo e organizado.',
      icon: BarChart3,
      img: dashboardImg
    },
    {
      title: 'Automação Inteligente',
      desc: 'Automatize mensagens e tarefas repetitivas para focar no que importa.',
      icon: Zap,
      img: automationImg
    }
  ];

  const benefits = [
    { title: 'Gestão de Leads', icon: Users, desc: 'Centralize todos os seus contatos em um só lugar.' },
    { title: 'Organização de Tarefas', icon: LayoutDashboard, desc: 'Saiba exatamente o que fazer a cada dia.' },
    { title: 'Automação de Mensagens', icon: MessageSquare, desc: 'Responda instantaneamente aos seus leads.' },
    { title: 'Relatórios e Insights', icon: BarChart3, desc: 'Acompanhe o crescimento com dados reais.' },
    { title: 'Integrações', icon: Globe, desc: 'Conecte com n8n, ERPs e outras ferramentas.' },
    { title: 'Base Segura', icon: Database, desc: 'Seus dados protegidos com infraestrutura Top IA.' }
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Inline Header - Non-sticky per user request */}
      <header className="w-full absolute top-0 left-0 z-50">
        <div className="container mx-auto px-6 h-24 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter italic uppercase text-foreground">CRM TOP</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Funcionalidades</button>
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Sobre</button>
            <Link to="/login" className="text-sm font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors">Entrar</Link>
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest shadow-glow hover:scale-[1.05] transition-all"
            >
              Começar agora
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center gap-16 text-center">
            {/* Left Column */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <a 
                href="https://www.topia.solutions/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-6 hover:bg-primary/20 transition-colors"
              >
                <Rocket className="w-3 h-3" />
                Tecnologia Top IA
              </a>
              <h1 className="text-4xl lg:text-7xl font-black tracking-tighter text-foreground mb-6 leading-[0.9] italic uppercase">
                Gerencie clientes e automatize o seu negócio com inteligência
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
                CRM desenvolvido pela <a href="https://www.topia.solutions/" target="_blank" rel="noopener noreferrer" className="text-foreground font-bold italic hover:text-primary transition-colors underline decoration-primary/30">Top IA</a> para empresas angolanas que querem crescer com automação e organização real.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm uppercase tracking-widest shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Começar agora
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-secondary text-foreground font-black text-sm uppercase tracking-widest border border-border hover:bg-secondary/80 transition-all"
                >
                  Ver como funciona
                </button>
              </div>
            </motion.div>

            {/* Right Column - Real Dashboard Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-5xl mx-auto"
            >
              <div className="relative z-10 rounded-[24px] lg:rounded-[40px] overflow-hidden shadow-2xl border border-border group bg-white">
                <img 
                  src={dashboardImg} 
                  alt="CRM TOP Dashboard" 
                  className="w-full h-auto transform group-hover:scale-105 transition-transform duration-1000 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </div>
              
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-4">Essencial para seu Crescimento</h2>
            <p className="text-muted-foreground font-medium">Três pilares fundamentais para transformar sua operação comercial de forma transparente.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8 }}
                className="bg-card p-8 rounded-[32px] border border-border shadow-card flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground text-sm mb-8 flex-1 leading-relaxed">{f.desc}</p>
                <div className="rounded-xl overflow-hidden border border-border/50 bg-white">
                    <img src={f.img} alt={f.title} className="w-full h-40 object-cover grayscale hover:grayscale-0 transition-all duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Functionalities Grid */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="p-6 rounded-2xl bg-muted/50 border border-border/50 hover:bg-white hover:shadow-card transition-all group">
                  <b.icon className="w-5 h-5 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-sm mb-1">{b.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic mb-6">Tudo o que você realmente precisa</h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Desenvolvemos apenas o que gera valor. Sem exageros, apenas ferramentas eficientes para organizar seus leads e automatizar sua produtividade.
              </p>
              <ul className="space-y-4 inline-block text-left">
                {['Interface Real do Usuário', 'Cards Organizados por Status', 'Uso Simulado do CRM Real'].map((t, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* System Visualization */}
      <section className="py-24 bg-card border-y border-border overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-4">Veja o sistema em funcionamento</h2>
            <p className="text-muted-foreground font-medium italic">Transparência total: veja exatamente o que você vai usar.</p>
          </div>
          
          <div className="relative max-w-5xl mx-auto">
            <div className="rounded-[40px] overflow-hidden border-8 border-muted shadow-elevated bg-white">
              <img src={dashboardImg} alt="System Screen" className="w-full opacity-90" />
            </div>
            {/* Overlay features */}
            <div className="absolute top-1/4 -left-10 p-5 bg-white rounded-2xl shadow-elevated border border-border hidden xl:block max-w-[200px] animate-bounce-slow">
              <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest"><ShieldCheck className="w-4 h-4" /> 100% Seguro</div>
              <p className="text-[11px] font-bold text-muted-foreground">Base de dados privada com tecnologia Top IA.</p>
            </div>
            <div className="absolute bottom-1/4 -right-10 p-5 bg-white rounded-2xl shadow-elevated border border-border hidden xl:block max-w-[200px] animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2 mb-2 text-primary font-bold text-[10px] uppercase tracking-widest"><MousePointer2 className="w-4 h-4" /> Intuitivo</div>
              <p className="text-[11px] font-bold text-muted-foreground">Mova seus leads com facilidade no pipeline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Added back with corrected logic */}
      <section id="pricing" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase italic mb-4">Planos Transparentes</h2>
            <p className="text-muted-foreground font-medium">Escolha a escala ideal para o seu negócio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                name: 'Iniciante', 
                price: 'Grátis', 
                features: ['Gestão de Leads Básica', 'Pipeline Simples', 'Suporte Comunitário'],
                cta: 'Começar agora',
                to: '/signup',
                accent: 'bg-muted'
              },
              { 
                name: 'Starter', 
                price: '25.000 Kz', 
                features: ['Tudo do Iniciante', 'Automação Básica', 'Relatórios Mensais'],
                cta: 'Assinar Plano',
                action: 'upgrade',
                to: '',
                accent: 'bg-emerald-50'
              },
              { 
                name: 'Profissional', 
                price: '50.000 Kz', 
                popular: true,
                features: ['Tudo do Starter', 'Gestão de Equipas', 'API Aberta (n8n)', 'Insights em Real-time'],
                cta: 'Assinar Plano',
                action: 'upgrade',
                to: '',
                accent: 'bg-primary/5'
              },
              { 
                name: 'Enterprise', 
                price: '100.000 Kz', 
                features: ['Tudo do Profissional', 'Customizações Exclusivas', 'Suporte 24/7 Dedicado', 'SLA de Performance'],
                cta: 'Contactar Vendas',
                action: 'upgrade',
                to: '',
                accent: 'bg-slate-900',
                dark: true
              }
            ].map((p, i) => (
              <div key={i} className={`relative flex flex-col p-8 rounded-[32px] border ${p.popular ? 'border-primary shadow-elevated scale-105 z-10' : 'border-border'} ${p.dark ? 'bg-slate-900 text-white' : 'bg-card'}`}>
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4">{p.name}</h3>
                <div className="mb-8">
                  <span className="text-3xl font-black tracking-tighter">{p.price}</span>
                  {p.price.includes('Kz') && <span className={`text-xs ml-1 ${p.dark ? 'text-slate-400' : 'text-muted-foreground'}`}>/mês</span>}
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-xs font-medium">
                      <CheckCircle2 className={`w-4 h-4 ${p.dark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => p.action === 'upgrade' ? setIsUpgradeOpen(true) : (p.to && p.to.startsWith('/') ? navigate(p.to) : p.to && window.open(p.to, '_blank'))}
                  className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    p.popular 
                      ? 'bg-primary text-white shadow-glow hover:scale-[1.05]' 
                      : p.dark 
                        ? 'bg-white text-slate-900 hover:bg-slate-100' 
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional About */}
      <section id="about" className="py-24 bg-secondary/10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-card p-12 md:p-20 rounded-[64px] border border-border text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Building2 className="w-32 h-32 text-primary rotate-12" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase italic mb-8 relative z-10">Sobre o CRM</h2>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium relative z-10">
              O <span className="text-primary font-black uppercase">CRM TOP</span> foi desenvolvido pela <a href="https://www.topia.solutions/" target="_blank" rel="noopener noreferrer" className="text-foreground font-bold italic hover:text-primary transition-colors underline decoration-primary/30">Top IA</a>, uma empresa sediada em <span className="text-foreground font-bold italic">Portugal</span>, com foco em automação, produtividade e simplicidade, ajudando empresas angolanas a organizar processos e escalar operações com o poder da tecnologia de ponta e inteligência comercial.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        </div>
        <div className="container mx-auto px-6 text-center text-white relative z-10">
          <h2 className="text-4xl lg:text-7xl font-black tracking-tighter uppercase italic mb-10 leading-none">Comece a organizar o seu negócio hoje</h2>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-16 py-6 rounded-2xl bg-white text-primary font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 mx-auto transition-transform hover:rotate-1"
          >
            Começar agora
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border bg-card">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md"><Zap className="w-6 h-6 text-white" /></div>
            <span className="font-black text-xl tracking-tighter italic uppercase text-foreground">CRM TOP</span>
          </div>
          <div className="text-center md:text-right">
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-2 opacity-50">
                &copy; 2026 CRM TOP &bull; Todos os direitos reservados
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Desenvolvido com excelência pela <a href="https://www.topia.solutions/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">Top IA</a> &bull; Portugal
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                Contacto Oficial: <a href="mailto:geral@topia.solutions" className="hover:text-primary transition-colors font-medium">geral@topia.solutions</a>
              </p>
          </div>
        </div>
      </footer>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </div>
  );
}
