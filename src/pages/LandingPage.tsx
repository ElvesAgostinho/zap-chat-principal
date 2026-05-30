import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageSquare, Zap, BarChart3, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import MockupDashboard from '../components/landing/MockupDashboard';
import MockupAutomationBlocks from '../components/landing/MockupAutomationBlocks';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-sky-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 mix-blend-overlay"></div>
              <MessageSquare className="w-5 h-5 text-white fill-white/20 absolute" />
              <Zap className="w-3 h-3 text-white fill-white absolute" />
            </div>
            <span className="font-extrabold text-[20px] text-slate-800 leading-none tracking-tight">
              Zap<span className="text-blue-500">CRM</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
              Entrar
            </Link>
            <Link to="/signup" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5">
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm mb-6 shadow-sm">
            <span>🇦🇴</span>
            <span>100% focado no mercado Angolano</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Automatiza o teu WhatsApp.<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">
              Multiplica as tuas Vendas.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            O CRM feito de angolanos para angolanos. Cria chatbots em minutos, gere os teus leads e aumenta a tua faturação automaticamente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group">
              Começar Agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
              Aceder ao Painel
            </Link>
          </div>
          
          <div className="mt-20 relative max-w-5xl mx-auto text-left">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent z-20 h-full w-full pointer-events-none"></div>
            <MockupDashboard />
          </div>
        </div>
      </main>

      {/* Flow Builder Mockup Section */}
      <section className="py-24 bg-white border-t border-slate-100 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Automação Visual Intuitiva</h2>
            <p className="text-slate-500">Constrói fluxos de atendimento completos e visualiza o seu desempenho.</p>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none"></div>
            <MockupAutomationBlocks />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-100 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tudo o que precisas para crescer</h2>
            <p className="text-slate-500">Ferramentas de classe mundial, desenhadas para simplicidade e conversão.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Construtor Visual</h3>
              <p className="text-slate-500 leading-relaxed">
                Cria fluxos de mensagens complexos arrastando blocos. Sem precisar de saber programar.
              </p>
            </div>
            
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">CRM Integrado</h3>
              <p className="text-slate-500 leading-relaxed">
                Gere todos os teus contactos, etiquetas e funis de vendas num só lugar organizado.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Métricas em Tempo Real</h3>
              <p className="text-slate-500 leading-relaxed">
                Acompanha as tuas taxas de abertura, conversões e o crescimento do teu negócio ao vivo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Plano Único e Transparente</h2>
            <p className="text-slate-500">Tudo o que o teu negócio precisa por um valor acessível, sem surpresas.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden max-w-lg mx-auto transform hover:-translate-y-1 transition-transform duration-300">
            <div className="p-8 text-center bg-gradient-to-br from-blue-600 to-sky-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Acesso Completo</h3>
              <div className="text-white/80 text-sm font-bold uppercase tracking-wider mb-4 relative z-10">Plano Mensal</div>
              <div className="flex items-center justify-center gap-1 relative z-10">
                <span className="text-5xl font-extrabold text-white">25.000</span>
                <span className="text-xl text-white/80 font-medium mt-2">Kz/mês</span>
              </div>
            </div>
            <div className="p-8">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3 mb-8 text-left">
                {[
                  '1 número WhatsApp',
                  'Automações',
                  'Chatbot',
                  'Etiquetas',
                  'Atendimento',
                  'Funil visual',
                  'Respostas rápidas',
                  'Suporte básico'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-700 font-medium text-[13px] md:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="w-full py-4 bg-blue-600 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center">
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-[18px] text-white">
              Zap<span className="text-sky-400">CRM</span>
            </span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} ZapCRM. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
