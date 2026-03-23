import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, ExternalLink } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
}

export default function FloatingSupportBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'bot',
    text: 'Olá! Sou o assistente de IA da **Top IA** para o ZapVendas CRM. Como posso ajudar a escalar o seu negócio hoje?'
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateResponse = (msg: string) => {
    const text = msg.toLowerCase();
    
    if (text.includes('preço') || text.includes('plano') || text.includes('pagar') || text.includes('custo') || text.includes('comprar')) {
      return 'Temos 3 planos concebidos para o seu crescimento:\n1. **Starter (25.000 Kz)**: Para micro-negócios, até 200 leads.\n2. **Profissional (50.000 Kz)**: Leads ilimitados e BI inteligente. (Mais popular!)\n3. **Enterprise (100.000 Kz)**: Atendimento sem limites.\nPode selecionar o seu plano após criar a conta!';
    }
    
    if (text.includes('top ia') || text.includes('topia') || text.includes('serviços') || text.includes('criar site') || text.includes('agência')) {
      return 'A **Top IA** é a agência europeia líder em Automação e Inteligência Artificial responsável pelo desenvolvimento impecável deste CRM.\nSe pretende implementar mais soluções com Inteligência Artificial para a sua empresa ou criar o seu próprio sistema, não hesite em visitar o nosso portal: https://www.topia.solutions/';
    }

    if (text.includes('suporte') || text.includes('humano') || text.includes('whatsapp') || text.includes('falar') || text.includes('ajuda')) {
      return 'Para acompanhamento mais técnico e direto, a nossa equipa de especialistas reais está pronta para ajudar!\nEnvie-nos uma mensagem via WhatsApp no **+351 936179188**.';
    }

    if (text.includes('crm') || text.includes('zapvendas') || text.includes('como funciona')) {
      return 'O ZapVendas CRM centraliza e organiza o atendimento via WhatsApp de toda a sua equipa. Controlamos desde o primeiro contacto (Lead) até à Venda Concluída através de um sistema drag-and-drop extremamente fluído.';
    }

    return 'Continuo em desenvolvimento focado na sua melhor experiência. Para qualquer questão avançada sobre pagamentos ou otimização do seu CRM, aconselho vivamente que fale com a nossa equipa de humanos no WhatsApp pelo **+351 936179188** ou conheça quem me programou em https://www.topia.solutions/';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking delay
    setTimeout(() => {
      const responseText = generateResponse(userMessage.text);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: responseText }]);
      setIsTyping(false);
    }, 1200);
  };

  // Text Formatter for formatting bold words (**word**) and raw URLs
  const formatText = (text: string) => {
    // 1. Replaces basic markdown bold with bold span
    // 2. Replaces http links with anchor tags
    // By keeping it strictly to a robust string mapping it perfectly renders
    const elements: React.ReactNode[] = [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // First, split by URL
    const partsByUrl = text.split(urlRegex);
    
    let keyIdx = 0;
    partsByUrl.forEach((part, i) => {
      if (part.match(urlRegex)) {
        elements.push(
          <a key={`url-${keyIdx++}`} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-bold bg-primary/10 px-1.5 py-0.5 rounded-md mt-1 mb-1 shadow-sm transition-all hover:bg-primary/20">
            Aceder Portal <ExternalLink className="w-3 h-3" />
          </a>
        );
      } else {
        // Now split by **bold**
        const boldParts = part.split(/\*\*(.*?)\*\*/g);
        boldParts.forEach((bp, j) => {
          if (j % 2 !== 0) { // Bold section
            elements.push(<span key={`bold-${keyIdx++}`} className="font-bold text-foreground">{bp}</span>);
          } else if (bp.length > 0) {
            // Further split by newlines
            const newLines = bp.split('\n');
            newLines.forEach((line, k) => {
              elements.push(<span key={`text-${keyIdx++}`}>{line}</span>);
              if (k < newLines.length - 1) {
                elements.push(<br key={`br-${keyIdx++}`} />);
              }
            });
          }
        });
      }
    });

    return elements;
  };

  return (
    <>
      {/* The Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-elevated flex items-center justify-center z-[100] group"
          >
            <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
            <MessageSquare className="w-6 h-6 relative z-10 transition-transform group-hover:-rotate-[-10deg]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* The Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-48px)] bg-card border border-border shadow-elevated rounded-2xl flex flex-col overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="bg-primary/5 border-b border-border/50 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md relative">
                  <Bot className="w-6 h-6 text-white" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <h3 className="font-black tracking-tight text-sm leading-tight text-foreground">Top IA Assist</h3>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                title="Fechar Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-secondary/10">
              {messages.map((m) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={m.id} 
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-white dark:bg-zinc-900 border border-border text-foreground rounded-tl-sm'
                    }`}
                  >
                    {m.role === 'user' ? m.text : formatText(m.text)}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white dark:bg-zinc-900 border border-border p-4 flex gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border shrink-0">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Escreva a sua dúvida aqui..."
                  className="w-full bg-muted border border-border/50 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow text-foreground"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 w-9 h-9 flex items-center justify-center text-primary disabled:opacity-50 disabled:text-muted-foreground hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[9px] text-muted-foreground font-medium mt-2 uppercase tracking-widest">
                Desenvolvido por Top IA
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
