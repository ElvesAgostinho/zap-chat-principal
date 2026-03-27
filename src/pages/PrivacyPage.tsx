import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Database, Lock, EyeOff, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  const sections = [
    {
      icon: Database,
      title: 'Recolha de Dados',
      content: 'Recolhemos dados essenciais para o funcionamento da plataforma, incluindo nome, email, telefone comercial e dados relativos à faturação. Os dados dos seus leads são armazenados de forma segura e não são partilhados com terceiros.'
    },
    {
      icon: Lock,
      title: 'Segurança da Informação',
      content: 'Utilizamos encriptação de ponta a ponta e bases de dados isoladas para garantir que apenas o administrador da loja e a sua equipa autorizada tenham acesso às informações operacionais.'
    },
    {
      icon: ShieldAlert,
      title: 'Processamento de Mensagens',
      content: 'O CRM TOP atua como processador de dados para as suas comunicações via WhatsApp. Não utilizamos os dados dos seus clientes para fins de marketing próprio ou venda de bases de dados.'
    },
    {
      icon: EyeOff,
      title: 'Privacidade de Leads',
      content: 'A privacidade dos seus leads é prioridade. Todos os números de telefone e históricos de conversas são mantidos sob sigilo industrial, protegidos por RLS (Row Level Security) na nossa infraestrutura cloud.'
    },
    {
      icon: UserCheck,
      title: 'Direitos do Utilizador',
      content: 'O utilizador tem o direito de solicitar a exportação ou eliminação definitiva dos seus dados a qualquer momento. Em conformidade com a legislação angolana e europeia, garantimos a portabilidade total dos dados.'
    }
  ];

  return (
    <div className="force-dark min-h-screen bg-[#0B0F14] text-white selection:bg-primary/30 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Página Inicial</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <ShieldAlert className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Política de Privacidade</h1>
              <p className="text-slate-400 mt-1 text-sm uppercase tracking-widest">Privacidade de Dados Enterprise</p>
            </div>
          </div>
          
          <div className="h-0.5 w-32 bg-primary mb-8" />
          <p className="text-slate-400 max-w-2xl text-sm italic">
            Esta política explica como a TOP IA SOLUTIONS recolhe, utiliza e protege as informações dos seus utilizadores em conformidade com as melhores práticas globais de segurança.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <section.icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-4 text-white">{section.title}</h2>
              <p className="text-slate-300 leading-relaxed text-sm">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Closing Note */}
        <div className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
          <div className="max-w-md">
            <h3 className="text-lg font-bold mb-2 text-white">Compromisso com a Segurança</h3>
            <p className="text-slate-400 text-xs uppercase tracking-widest leading-relaxed">
              O CRM TOP utiliza infraestrutura Tier 4 e auditorias periódicas para garantir a integridade máxima do seu negócio. Desenvolvido por <a href="https://www.topia.solutions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TOP IA SOLUTIONS</a>.
            </p>
          </div>
          <Link 
            to="/signup" 
            className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-primary font-bold text-sm hover:bg-primary hover:text-black transition-all"
          >
            Começar Agora
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
