import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, ShoppingBag, Package, MessageSquare, Calendar, X, ArrowRight } from 'lucide-react';
import { Produto, Lead, Venda } from '@/types';

type Tab = 'dashboard' | 'orders' | 'chat' | 'clients' | 'products' | 'campaigns' | 'alerts' | 'settings' | 'admin' | 'schedule' | 'pipeline' | 'stock';

interface SearchResult {
  id: string;
  type: 'lead' | 'product' | 'order';
  title: string;
  subtitle: string;
  icon: typeof Users;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  products: Produto[];
  vendas: Venda[];
  onNavigateTab: (tab: Tab) => void;
  onNavigateChat: (leadId: string) => void;
}

export default function CommandPalette({ open, onClose, leads, products, vendas, onNavigateTab, onNavigateChat }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else { /* parent handles open */ }
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const items: SearchResult[] = [];

    // Search leads
    leads.filter(l => l.nome.toLowerCase().includes(q) || l.telefone?.includes(q) || l.email?.toLowerCase().includes(q))
      .slice(0, 5).forEach(l => {
        items.push({
          id: `lead-${l.id}`,
          type: 'lead',
          title: l.nome,
          subtitle: l.telefone || l.email || l.status,
          icon: Users,
          action: () => { onNavigateChat(l.id); onClose(); },
        });
      });

    // Search products
    products.filter(p => p.nome.toLowerCase().includes(q))
      .slice(0, 5).forEach(p => {
        items.push({
          id: `product-${p.id}`,
          type: 'product',
          title: p.nome,
          subtitle: `${p.estoque} em estoque`,
          icon: Package,
          action: () => { onNavigateTab('products'); onClose(); },
        });
      });

    // Search orders
    vendas.filter(v => v.cliente_nome?.toLowerCase().includes(q) || v.produto?.toLowerCase().includes(q))
      .slice(0, 5).forEach(v => {
        items.push({
          id: `order-${v.id}`,
          type: 'order',
          title: v.cliente_nome || 'Pedido',
          subtitle: v.produto || v.status,
          icon: ShoppingBag,
          action: () => { onNavigateTab('orders'); onClose(); },
        });
      });

    return items;
  }, [query, leads, products, vendas, onNavigateTab, onNavigateChat, onClose]);

  const quickActions = [
    { label: 'Painel', icon: Search, action: () => { onNavigateTab('dashboard'); onClose(); } },
    { label: 'Conversas', icon: MessageSquare, action: () => { onNavigateTab('chat'); onClose(); } },
    { label: 'Pipeline', icon: Users, action: () => { onNavigateTab('pipeline'); onClose(); } },
    { label: 'Agenda', icon: Calendar, action: () => { onNavigateTab('schedule'); onClose(); } },
  ];

  const typeColors = {
    lead: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    product: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    order: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[100] w-[92vw] max-w-lg"
          >
            <div className="bg-card rounded-2xl shadow-elevated border border-border overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar leads, produtos, pedidos..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
                {query.trim() ? (
                  results.length > 0 ? (
                    <div className="p-2 space-y-0.5">
                      {results.map(r => (
                        <button
                          key={r.id}
                          onClick={r.action}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-accent transition-colors group"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[r.type]}`}>
                            <r.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhum resultado para "{query}"</p>
                    </div>
                  )
                ) : (
                  <div className="p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2 mb-2">Ações Rápidas</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {quickActions.map(a => (
                        <button
                          key={a.label}
                          onClick={a.action}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground hover:bg-accent transition-colors"
                        >
                          <a.icon className="w-4 h-4" />
                          {a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2 border-t border-border bg-secondary/30">
                <p className="text-[10px] text-muted-foreground text-center">
                  <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono">ESC</kbd> para fechar
                  {' · '}
                  <kbd className="px-1.5 py-0.5 rounded border border-border text-[10px] font-mono">⌘K</kbd> para abrir
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
