import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Zap, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  const sections = [
    {
      title: '1. Aceitação dos Termos',
      content: 'Ao aceder e utilizar o CRM TOP (doravante "Plataforma"), propriedade da TOP IA SOLUTIONS, o utilizador concorda em cumprir e estar vinculado aos seguintes Termos e Condições. Se não concordar com qualquer parte destes termos, não deverá utilizar o serviço.'
    },
    {
      title: '2. Descrição do Serviço',
      content: 'O CRM TOP é uma plataforma SaaS (Software as a Service) que fornece ferramentas de gestão de leads, automação de mensagens via WhatsApp, dashboards de vendas e gestão de logística. A disponibilidade do serviço e as suas funcionalidades dependem do plano subscrito.'
    },
    {
      title: '3. Responsabilidade do Utilizador',
      content: 'O utilizador é o único responsável pelo conteúdo das mensagens enviadas e pela conformidade com as regras do WhatsApp. A Plataforma não se responsabiliza por banimentos ou suspensões de números de telefone resultantes de uso indevido ou spam.'
    },
    {
      title: '4. Pagamentos e Assinaturas',
      content: 'O acesso à Plataforma é baseado em subscrição. Os pagamentos são efetuados via transferência bancária com upload de comprovativo ou outros métodos disponibilizados. O atraso no pagamento resultará na suspensão imediata do acesso aos serviços.'
    },
    {
      title: '5. Propriedade Intelectual',
      content: 'Todo o conteúdo, design, código-fonte e algoritmos da Plataforma são propriedade exclusiva da TOP IA SOLUTIONS. É proibida a engenharia reversa, cópia ou redistribuição de qualquer componente do sistema sem autorização prévia.'
    },
    {
      title: '6. Limitação de Responsabilidade',
      content: 'A TOP IA SOLUTIONS não se responsabiliza por perdas de dados decorrentes de falhas técnicas externas, ações de terceiros ou má utilização do sistema pelo utilizador final.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white selection:bg-primary/30 pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Voltar à Página Inicial</span>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Termos de Serviço</h1>
              <p className="text-muted-foreground mt-1">Última atualização: Março de 2026</p>
            </div>
          </div>
          
          <div className="h-px w-full bg-gradient-to-r from-primary/50 via-white/5 to-transparent" />
        </div>

        {/* Content */}
        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.section 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute -left-6 top-0 bottom-0 w-px bg-white/5 group-hover:bg-primary/30 transition-colors" />
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-primary/50 text-sm font-mono">0{index + 1}</span>
                {section.title}
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm lg:text-base pl-2">
                {section.content}
              </p>
            </motion.section>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-20 p-8 rounded-3xl bg-white/[0.02] border border-white/5 text-center"
        >
          <Zap className="w-10 h-10 text-primary mx-auto mb-6 shadow-glow" />
          <h3 className="text-lg font-bold mb-2 uppercase tracking-tighter">Dúvidas Jurídicas?</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Se tiver qualquer questão sobre estes termos, por favor contacte o nosso suporte via WhatsApp ou e-mail corporativo.
          </p>
          <a href="mailto:geral@topia.solutions" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
            geral@topia.solutions <CheckCircle2 className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
