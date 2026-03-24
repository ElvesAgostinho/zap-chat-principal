import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, Plus, Minus, X, ChevronRight, Loader2, Store, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Produto } from '@/types';
import { formatCurrency } from '@/data/mock';
import { toast } from 'sonner';

interface CartItem extends Produto {
  quantity: number;
}

export default function CatalogPage() {
  const { storeCode } = useParams<{ storeCode: string }>();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({ name: '', phone: '' });
  const [categorias, setCategorias] = useState<string[]>(['Tudo']);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Tudo');

  useEffect(() => {
    async function fetchStoreContent() {
      if (!storeCode) return;
      setLoading(true);
      
      const { data: storeData, error: storeError } = await (supabase as any)
        .from('lojas')
        .select('*')
        .eq('codigo_unico', storeCode)
        .maybeSingle();

      if (storeError || !storeData) {
        toast.error('Loja não encontrada');
        setLoading(false);
        return;
      }

      const { data: productsData } = await (supabase as any)
        .from('produtos')
        .select('*')
        .eq('loja_id', storeData.id)
        .order('nome');

      setStore(storeData);
      setProducts(productsData || []);
      
      const uniqueCats = Array.from(new Set((productsData || []).map((p: any) => p.categoria).filter(Boolean))) as string[];
      setCategorias(['Tudo', ...uniqueCats]);
      
      setLoading(false);
    }
    fetchStoreContent();
  }, [storeCode]);

  const addToCart = (product: Produto) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.nome} adicionado ao carrinho`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const checkoutWhatsApp = async () => {
    if (cart.length === 0) return;
    if (!orderDetails.name || !orderDetails.phone) {
      toast.error('Por favor, preencha o seu nome e telefone.');
      return;
    }
    
    setCheckoutLoading(true);
    try {
      // 1. Create Order (Venda) in Database to register the intent tracking
      const { data: venda, error: vError } = await (supabase as any)
        .from('vendas')
        .insert({
          loja_id: store.id,
          cliente_nome: orderDetails.name,
          cliente_telefone: orderDetails.phone,
          produto: cart.map(item => `${item.quantity}x ${item.nome}`).join(', '),
          valor: cartTotal,
          status: 'pendente',
          pagamento_status: 'pendente'
        })
        .select()
        .single();

      if (vError) throw vError;

      // 2. Generate WhatsApp message for the AI Bot
      let message = `Olá! O meu nome é ${orderDetails.name}. Acabei de montar o meu carrinho no Catálogo e quero finalizar o pedido:\n\n`;
      cart.forEach(item => {
        message += `🛒 ${item.quantity}x ${item.nome} - ${formatCurrency(item.preco * item.quantity)}\n`;
      });
      message += `\n💰 *Total: ${formatCurrency(cartTotal)}*\n`;
      
      // We pass the order ID so the bot can easily link it
      message += `\nReferência do Pedido: #${venda.id.slice(0, 8)}\n`;
      message += `\nComo faço para pagar? Aguardo as coordenadas bancárias.`;

      const cleanPhone = store.whatsapp_pagamento?.replace(/\D/g, '') || store.telefone?.replace(/\D/g, '') || '244923000000';
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

      // 3. Delegate to WhatsApp (Bot handles everything from here)
      window.open(url, '_blank');
      setCart([]);
      setIsCartOpen(false);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar pedido. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (categoriaAtiva === 'Tudo') return products;
    return products.filter(p => p.categoria === categoriaAtiva);
  }, [products, categoriaAtiva]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground font-medium animate-pulse">Carregando vitrine...</p>
      </div>
    </div>
  );

  if (!store) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loja não encontrada.</div>;

  return (
    <div className="min-h-screen bg-secondary/30 pb-32">
      {/* Premium Header */}
      <header className="bg-card border-b border-border/40 sticky top-0 z-40 backdrop-blur-xl bg-card/80">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-glow">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-foreground tracking-tight">{store.nome}</h1>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none">Catálogo Online</p>
            </div>
          </div>
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all group"
          >
            <ShoppingBag className="w-6 h-6 text-foreground group-hover:scale-110 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-glow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero / Banner */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="bg-gradient-to-br from-primary/20 to-violet-500/10 p-8 rounded-[32px] md:rounded-[40px] mb-8 border border-white/10 shadow-card">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2">Desperte o Seu Estilo ✨</h2>
          <p className="text-muted-foreground max-w-sm text-sm md:text-base">Explore as nossas coleções. Monte o seu look e finalize a compra diretamente pelo WhatsApp sem burocracias.</p>
        </div>

        {/* Categories (Horizontal Scroll) */}
        {categorias.length > 1 && (
          <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-6 mb-2 snap-x">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`snap-start whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  categoriaAtiva === cat 
                    ? 'bg-primary text-primary-foreground shadow-glow scale-105' 
                    : 'bg-card text-muted-foreground border border-border/40 hover:bg-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid - Masonry Style */}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filteredProducts.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-[32px] overflow-hidden shadow-card hover:shadow-elevated transition-all border border-border/40 group flex flex-col h-full"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-secondary">
                {product.imagem ? (
                  <img src={product.imagem} alt={product.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="w-10 h-10 opacity-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-black text-primary shadow-sm">
                    {formatCurrency(product.preco)}
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm md:text-base font-bold text-foreground mb-1 line-clamp-2 leading-tight">{product.nome}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-4 line-clamp-2 flex-1">{product.descricao}</p>
                <button 
                  onClick={() => addToCart(product)}
                  className="w-full py-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white font-black text-xs uppercase tracking-widest transition-all focus:scale-95 flex justify-center items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Comprar
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-card rounded-[40px] border border-dashed border-border/60">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </div>

      {/* Persistent Bottom Bar */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-0 right-0 px-6 z-40 pointer-events-none"
          >
            <button 
              onClick={() => setIsCartOpen(true)}
              className="max-w-md mx-auto w-full bg-foreground text-background h-16 rounded-full shadow-2xl flex items-center justify-between px-8 pointer-events-auto active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">{cartCount} itens no carrinho</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg">{formatCurrency(cartTotal)}</span>
                <ChevronRight className="w-5 h-5 opacity-50" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border/40 flex items-center justify-between bg-card">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-black text-foreground">Meu Carrinho</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-[24px] bg-secondary/30 border border-border/40">
                    <div className="w-20 h-20 rounded-2xl bg-card overflow-hidden flex-shrink-0">
                      {item.imagem ? <img src={item.imagem} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-muted/20"><ShoppingBag className="w-6 h-6 opacity-20" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm truncate">{item.nome}</h4>
                      <p className="text-xs text-primary font-black mt-1">{formatCurrency(item.preco)}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center bg-card rounded-xl border border-border/60">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-2 hover:text-primary transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-8 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-2 hover:text-primary transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40 py-20">
                    <ShoppingBag className="w-16 h-16 mb-4" />
                    <p className="font-medium text-lg">Seu carrinho está vazio</p>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-8 bg-card border-t border-border/40 space-y-6">
                  {/* Lead Info Form */}
                  <div className="space-y-3">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Seu Nome Completo" 
                        value={orderDetails.name}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <input 
                        type="tel" 
                        placeholder="Seu WhatsApp (ex: 2449...)" 
                        value={orderDetails.phone}
                        onChange={(e) => setOrderDetails(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3.5 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium text-sm">Total do Pedido</span>
                    <span className="text-2xl font-black text-foreground">{formatCurrency(cartTotal)}</span>
                  </div>
                  
                  <button 
                    onClick={checkoutWhatsApp}
                    disabled={checkoutLoading}
                    className="w-full py-5 rounded-[24px] bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-glow-emerald flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5 fill-current" />
                        Finalizar Pedido
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground px-4 italic leading-relaxed">
                    Ao finalizar, geraremos um pedido no nosso sistema e você poderá pagar via Multicaixa ou direto pelo WhatsApp.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
