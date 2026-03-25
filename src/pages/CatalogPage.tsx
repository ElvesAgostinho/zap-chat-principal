import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, Plus, Minus, X, ChevronRight, Loader2, Store, ShoppingCart, Heart, Share2, ChevronLeft, Palette, Ruler, Trash2, Star, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Produto } from '@/types';
import { formatCurrency } from '@/data/mock';
import { toast } from 'sonner';

/* ───── Types ───── */
interface CartItem extends Produto {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface ProductAtributos {
  cores?: string[];
  tamanhos?: string[];
  variacoes?: { cor: string; tamanho: string; estoque: number }[];
  [key: string]: any;
}

/* ───── Component ───── */
export default function CatalogPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({ name: '', phone: '' });
  const [categorias, setCategorias] = useState<string[]>(['Tudo']);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Tudo');
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [liked, setLiked] = useState<Set<string>>(new Set());

  /* ───── Data Fetching & LocalStorage ───── */
  useEffect(() => {
    const savedWishlist = localStorage.getItem('catalog_wishlist');
    if (savedWishlist) {
      try { setLiked(new Set(JSON.parse(savedWishlist))); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('catalog_wishlist', JSON.stringify(Array.from(liked)));
  }, [liked]);

  /* ───── Data Fetching ───── */
  useEffect(() => {
    async function fetchStoreContent() {
      if (!storeSlug) return;
      setLoading(true);

      const { data: storeData, error: storeError } = await (supabase as any)
        .from('lojas')
        .select('*')
        .or(`slug.eq.${storeSlug},codigo_unico.eq.${storeSlug}`)
        .limit(1)
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

      // Redirecionar para o slug se o endereço atual não for o link amigável (Slug)
      // Se encontramos a loja mas o que está na URL não bate com o slug oficial, 
      // significa que o utilizador entrou via código interno. Redirecionamos para o slug.
      if (storeData.slug && storeSlug !== storeData.slug) {
        navigate(`/loja/${storeData.slug}`, { replace: true });
      }

      const uniqueCats = Array.from(new Set((productsData || []).map((p: any) => p.categoria).filter(Boolean))) as string[];
      setCategorias(['Tudo', ...uniqueCats]);

      setLoading(false);
    }
    fetchStoreContent();
  }, [storeSlug]);

  /* ───── Helpers ───── */
  const getAtributos = (product: Produto): ProductAtributos => {
    if (!product.atributos) return {};
    if (typeof product.atributos === 'string') {
      try { return JSON.parse(product.atributos); } catch { return {}; }
    }
    return product.atributos as ProductAtributos;
  };

  const toggleLike = useCallback((id: string) => {
    setLiked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const openProductDetail = (product: Produto) => {
    setSelectedProduct(product);
    const variacoes = Array.isArray(product.variacoes) ? product.variacoes : [];
    if (variacoes.length > 0) {
      const firstInStock = variacoes.find(v => v.estoque > 0) || variacoes[0];
      setSelectedColor(firstInStock.cor || '');
      setSelectedSize(firstInStock.tamanho || '');
    } else {
      const attrs = getAtributos(product);
      setSelectedColor(attrs.cores?.[0] || '');
      setSelectedSize(attrs.tamanhos?.[0] || '');
    }
  };

  /* ───── Cart Logic ───── */
  const addToCart = (product: Produto, color?: string, size?: string) => {
    const cartKey = `${product.id}-${color || ''}-${size || ''}`;
    setCart(prev => {
      const existing = prev.find(item => `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}` === cartKey);
      if (existing) {
        return prev.map(item =>
          `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}` === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedColor: color, selectedSize: size }];
    });
    toast.success(`${product.nome} adicionado ao carrinho`);
    setSelectedProduct(null);
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(prev => prev.map(item => {
      const key = `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
      if (key === cartKey) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  /* ───── Checkout ───── */
  const checkoutWhatsApp = async () => {
    if (cart.length === 0) return;
    if (!orderDetails.name || !orderDetails.phone) {
      toast.error('Por favor, preencha o seu nome e telefone.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data: venda, error: vError } = await (supabase as any)
        .from('vendas')
        .insert({
          loja_id: store.id,
          cliente_nome: orderDetails.name,
          cliente_telefone: orderDetails.phone,
          produto: cart.map(item => {
            let desc = `${item.quantity}x ${item.nome}`;
            if (item.selectedSize) desc += ` (Tam: ${item.selectedSize})`;
            if (item.selectedColor) desc += ` (Cor: ${item.selectedColor})`;
            return desc;
          }).join(', '),
          valor: cartTotal,
          status: 'pendente',
          pagamento_status: 'pendente'
        })
        .select()
        .single();

      if (vError) throw vError;

      let message = `Olá! O meu nome é ${orderDetails.name}. Acabei de montar o meu carrinho no Catálogo e quero finalizar o pedido:\n\n`;
      cart.forEach(item => {
        let line = `🛒 ${item.quantity}x ${item.nome}`;
        if (item.selectedSize) line += ` | Tam: ${item.selectedSize}`;
        if (item.selectedColor) line += ` | Cor: ${item.selectedColor}`;
        line += ` - ${formatCurrency(item.preco * item.quantity)}`;
        message += line + '\n';
      });
      message += `\n💰 *Total: ${formatCurrency(cartTotal)}*\n`;
      message += `\nReferência do Pedido: #${venda.id.slice(0, 8)}\n`;
      message += `\nComo faço para pagar? Aguardo as coordenadas bancárias.`;

      const cleanPhone = store.whatsapp_pagamento?.replace(/\D/g, '') || store.telefone?.replace(/\D/g, '') || '244923000000';
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
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

  /* ───── Loading / Not Found ───── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-black mx-auto" />
        <p className="text-gray-400 font-medium text-sm animate-pulse">Carregando vitrine...</p>
      </div>
    </div>
  );

  if (!store) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-3">
        <Store className="w-12 h-12 text-gray-200 mx-auto" />
        <p className="text-gray-400 font-medium">Loja não encontrada.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* ══════ HEADER ══════ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-gray-900 tracking-tight leading-none">{store.nome}</h1>
              <p className="text-[9px] text-gray-400 uppercase font-semibold tracking-[0.15em]">Catálogo Online</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Wishlist Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-all"
            >
              <Heart className={`w-5 h-5 ${liked.size > 0 ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
              {liked.size > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-red-100 text-red-600 text-[8px] font-bold rounded-full flex items-center justify-center border-white border">
                  {liked.size}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl hover:bg-gray-50 transition-all"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center border-white border">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ══════ HERO BANNER ══════ */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-2">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 md:p-8 rounded-2xl mb-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M20 20l20 0 0 20-20 0z\'/%3E%3C/g%3E%3C/svg%3E")'}} />
          <div className="relative z-10">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em] mb-2">✦ Novidades</p>
            <h2 className="text-xl md:text-2xl font-black text-white mb-1">Novas Coleções Disponíveis</h2>
            <p className="text-gray-400 text-xs md:text-sm max-w-md">Explore o nosso catálogo e finalize a sua compra via WhatsApp. Rápido, simples e seguro.</p>
          </div>
        </div>
      </div>

      {/* ══════ CATEGORIES ══════ */}
      {categorias.length > 1 && (
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="flex overflow-x-auto hide-scrollbar gap-2 snap-x">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`snap-start whitespace-nowrap px-5 py-2 rounded-full text-xs font-semibold transition-all border ${
                  categoriaAtiva === cat
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ══════ PRODUCT GRID ══════ */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
          {filteredProducts.map((product, idx) => {
            const attrs = getAtributos(product);
            const hasColors = attrs.cores && attrs.cores.length > 0;
            const hasSizes = attrs.tamanhos && attrs.tamanhos.length > 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.3 }}
                className="bg-white rounded-xl overflow-hidden group cursor-pointer relative"
                onClick={() => openProductDetail(product)}
              >
                {/* Image Container — natural aspect ratio, no cropping */}
                <div className="relative overflow-hidden bg-gray-100">
                  {product.imagem ? (
                    <img
                      src={product.imagem}
                      alt={product.nome}
                      className="w-full h-auto min-h-[180px] max-h-[320px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-[220px] flex items-center justify-center text-gray-300">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                  )}

                  {/* Like Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleLike(product.id); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${liked.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                  </button>

                  {/* Attribute Badges */}
                  {(hasColors || hasSizes || (Array.isArray(product.variacoes) && product.variacoes.length > 0)) && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      {Array.isArray(product.variacoes) && product.variacoes.length > 0 ? (
                        <>
                          <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            {Array.from(new Set(product.variacoes.map((v: any) => v.cor).filter(Boolean))).length} cores
                          </span>
                        </>
                      ) : (
                        <>
                          {hasColors && (
                            <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Palette className="w-2.5 h-2.5" /> {attrs.cores!.length} cores
                            </span>
                          )}
                          {hasSizes && (
                            <span className="bg-white/90 backdrop-blur-sm text-gray-600 text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Ruler className="w-2.5 h-2.5" /> {attrs.tamanhos!.length} tam.
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug mb-1.5">{product.nome}</h3>
                  {product.descricao && (
                    <p className="text-[10px] text-gray-400 line-clamp-1 mb-2">{product.descricao}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-gray-900">{formatCurrency(product.preco)}</span>
                    {product.estoque <= 3 && product.estoque > 0 && (
                      <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">Últimas unidades</span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </div>

      {/* ══════ PRODUCT DETAIL MODAL ══════ */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const isLiked = liked.has(selectedProduct.id);
          
          // Compatibilidade com sistema antigo + novo sistema (variacoes jsonb)
          const variacoes = Array.isArray(selectedProduct.variacoes) ? selectedProduct.variacoes : [];
          const hasV2Variations = variacoes.length > 0;
          
          let availableColors: string[] = [];
          let availableSizes: string[] = [];
          let currentVariation: any = null;
          let displayImage = selectedProduct.imagem;
          let displayPrice = selectedProduct.preco;
          let stockRemaining = selectedProduct.estoque || 0;
          
          if (hasV2Variations) {
            availableColors = Array.from(new Set(variacoes.map((v: any) => v.cor).filter(Boolean)));
            // Tamanhos disponíveis dependem da cor selecionada no momento
            availableSizes = Array.from(new Set(
              variacoes
                .filter((v: any) => (!selectedColor || v.cor === selectedColor) && v.tamanho)
                .map((v: any) => v.tamanho)
            ));
            
            // Qual a variação exata?
            currentVariation = variacoes.find((v: any) => 
              (v.cor === selectedColor || (!v.cor && !selectedColor)) &&
              (v.tamanho === selectedSize || (!v.tamanho && !selectedSize))
            ) || variacoes.find((v: any) => v.cor === selectedColor);
            
            if (currentVariation) {
              displayImage = currentVariation.imagem || selectedProduct.imagem;
              displayPrice = currentVariation.preco > 0 ? currentVariation.preco : selectedProduct.preco;
              stockRemaining = currentVariation.estoque;
            } else {
              // Se tivermos cor mas não tivermos tamanho selecionado
               const matchingColorVars = variacoes.filter((v: any) => v.cor === selectedColor);
               if (matchingColorVars.length > 0) {
                 displayImage = matchingColorVars[0].imagem || selectedProduct.imagem;
               }
            }
          } else {
            // Fallback sistema antigo (Atributos sem stock estrito)
            const attrs = getAtributos(selectedProduct);
            availableColors = attrs.cores || [];
            availableSizes = attrs.tamanhos || [];
          }

          const isOutOfStock = stockRemaining <= 0;
          const hasColors = availableColors.length > 0;
          const hasSizes = availableSizes.length > 0;
          
          // Bloquear o carrinho se falta selecionar tamanho, quando for obrigatório
          const isSelectionIncomplete = hasV2Variations && hasSizes && !selectedSize;

          return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-40%" }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed left-1/2 top-1/2 w-[calc(100%-2rem)] md:w-full md:max-w-5xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden z-[101]"
                style={{ maxHeight: '90vh' }}
              >
                {/* Global Close/Action Tools */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-[110] pointer-events-none">
                  <button 
                    onClick={() => setSelectedProduct(null)} 
                    className="p-3 rounded-full bg-white/90 shadow-xl backdrop-blur-sm pointer-events-auto hover:bg-white active:scale-90 transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-900" />
                  </button>
                  <div className="flex gap-3 pointer-events-auto">
                    <button
                      onClick={() => toggleLike(selectedProduct.id)}
                      className={`p-3 rounded-full shadow-xl backdrop-blur-sm active:scale-90 transition-all ${
                        isLiked ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copiado!');
                      }}
                      className="p-3 rounded-full bg-white/90 shadow-xl backdrop-blur-sm text-gray-500 hover:bg-white active:scale-90 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* LEFT: IMAGE COLUMN */}
                <div className="w-full md:w-1/2 bg-white flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-100 h-[45vh] md:h-auto min-h-[300px] overflow-hidden">
                  {displayImage ? (
                    <motion.img 
                      key={displayImage} // Animação suave ao trocar cor
                      initial={{ opacity: 0.7, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      src={displayImage} 
                      alt={selectedProduct.nome} 
                      className="w-full h-full object-contain p-10 md:p-14 transition-transform duration-700 hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-200">
                      <ShoppingBag className="w-16 h-16" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sem Foto</span>
                    </div>
                  )}
                  {/* Stock Badges */}
                  {stockRemaining > 0 && stockRemaining <= 3 && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 md:bottom-6 md:top-auto md:left-6 md:translate-x-0">
                      <span className="bg-orange-500 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xl italic tracking-tight uppercase animate-pulse">
                        Últimas {stockRemaining} Unidades!
                      </span>
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute inset-x-0 bottom-0 bg-red-500 text-white text-center py-3 text-xs font-black uppercase tracking-widest">
                       Produto Esgotado
                    </div>
                  )}
                </div>

                {/* RIGHT: INFO COLUMN */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                  <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-8 md:p-12">
                    <div className="space-y-8">
                      {/* Product Header */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded tracking-tighter uppercase">Original · Enterprise</span>
                          <div className="flex text-yellow-400">
                            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                          </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-950 leading-[1.1] tracking-tight uppercase">
                          {selectedProduct.nome}
                        </h2>
                        <div className="flex items-end gap-3 pt-2">
                          <span className={`text-3xl md:text-4xl font-black tracking-tighter ${isOutOfStock ? 'text-gray-400' : 'text-red-600'}`}>
                            {formatCurrency(displayPrice)}
                          </span>
                          {!isOutOfStock && (
                            <span className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">+ Portes</span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {selectedProduct.descricao && (
                        <div className="p-5 bg-gray-50/50 rounded-3xl space-y-3">
                           <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Info className="w-4 h-4" /> Detalhes do Produto
                           </h4>
                           <p className="text-sm text-gray-600 leading-relaxed font-medium">
                              {selectedProduct.descricao}
                           </p>
                        </div>
                      )}

                      {/* Attribute Selectors (SHEIN STYLE) */}
                      <div className="space-y-8 pt-2">
                        {!hasColors && !hasSizes && !hasV2Variations && (
                           <div className="py-6 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
                              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Tamanho Único · Pronta Entrega</p>
                           </div>
                        )}

                        {hasColors && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex justify-between">
                              <span>Cor: <span className="text-black italic">{selectedColor || 'Selecione a cor'}</span></span>
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {availableColors.map(cor => {
                                // Verifica se TODAS as variações desta cor estão sem stock
                                const hasStockInColor = hasV2Variations 
                                  ? variacoes.some((v: any) => v.cor === cor && v.estoque > 0)
                                  : true;

                                return (
                                  <button
                                    key={cor}
                                    onClick={() => {
                                      setSelectedColor(cor);
                                      // Logica para limpar tamanho se a nova cor não tiver o tamanho antigo disponível
                                      if (hasV2Variations && selectedSize) {
                                         const valid = variacoes.some((v:any) => v.cor === cor && v.tamanho === selectedSize && v.estoque > 0);
                                         if (!valid) setSelectedSize('');
                                      }
                                    }}
                                    className={`relative group h-12 rounded-2xl px-5 text-[11px] font-black transition-all border-2 overflow-hidden ${
                                      selectedColor === cor 
                                        ? 'border-black text-black shadow-xl' 
                                        : 'border-gray-100 text-gray-400 hover:border-gray-300'
                                    } ${!hasStockInColor ? 'opacity-40 line-through' : ''}`}
                                  >
                                    <span className="relative z-10">{cor}</span>
                                    {selectedColor === cor && (
                                       <motion.div layoutId="color-marker" className="absolute inset-0 bg-black/5 z-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {hasSizes && (
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              Tamanho: <span className={selectedSize ? "text-black italic" : "text-red-500"}>{selectedSize || 'Selecione Obrigatório'}</span>
                            </h4>
                            <div className="flex flex-wrap gap-2.5">
                              {availableSizes.map(tam => {
                                // Verifica se o tamanho exato na cor atual tem stock
                                const hasStockForSize = hasV2Variations
                                  ? variacoes.some((v: any) => v.tamanho === tam && (!selectedColor || v.cor === selectedColor) && v.estoque > 0)
                                  : true;

                                return (
                                  <button
                                    key={tam}
                                    disabled={!hasStockForSize}
                                    onClick={() => setSelectedSize(tam)}
                                    className={`min-w-[64px] h-12 rounded-2xl text-[11px] font-black transition-all border-2 ${
                                      selectedSize === tam 
                                        ? 'border-black bg-black text-white shadow-xl' 
                                        : 'border-gray-100 text-gray-600 hover:border-gray-300 bg-white'
                                    } ${!hasStockForSize ? 'opacity-30 bg-gray-50 cursor-not-allowed border-gray-100' : ''}`}
                                  >
                                    <span className={!hasStockForSize ? 'line-through' : ''}>{tam}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Buy Button */}
                  <div className="p-8 md:p-12 border-t border-gray-50 bg-white/90 backdrop-blur-md">
                    <button
                      onClick={() => addToCart({ ...selectedProduct, preco: displayPrice }, selectedColor || undefined, selectedSize || undefined)}
                      disabled={isOutOfStock || isSelectionIncomplete}
                      className={`w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        (isOutOfStock || isSelectionIncomplete) ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-900 shadow-2xl shadow-black/10'
                      }`}
                    >
                      {isOutOfStock ? (
                        <span>Esgotado na Variedade</span>
                      ) : isSelectionIncomplete ? (
                        <span>Selecione o Tamanho</span>
                      ) : (
                        <>
                          <ShoppingBag className="w-5 h-5" />
                          <span>Adicionar à Sacola</span>
                        </>
                      )}
                      </button>
                    </div>
                  </div>
                </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ══════ FLOATING CART BAR ══════ */}
      <AnimatePresence>
        {cartCount > 0 && !isCartOpen && !selectedProduct && (
          <motion.div
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="max-w-md mx-auto w-full bg-black text-white h-14 rounded-2xl shadow-2xl flex items-center justify-between px-6 pointer-events-auto active:scale-[0.97] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-sm">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base">{formatCurrency(cartTotal)}</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════ CART DRAWER ══════ */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
            >
              {/* Cart Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-gray-800" />
                  <h2 className="text-base font-bold text-gray-900">Carrinho ({cartCount})</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.map(item => {
                  const cartKey = `${item.id}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
                  return (
                    <div key={cartKey} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-16 h-16 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-100">
                        {item.imagem ? (
                          <img src={item.imagem} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-xs truncate">{item.nome}</h4>
                        {(item.selectedColor || item.selectedSize) && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.selectedColor && <span>Cor: {item.selectedColor}</span>}
                            {item.selectedColor && item.selectedSize && <span> · </span>}
                            {item.selectedSize && <span>Tam: {item.selectedSize}</span>}
                          </p>
                        )}
                        <p className="text-xs text-red-600 font-bold mt-1">{formatCurrency(item.preco)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center bg-white rounded-lg border border-gray-200">
                            <button onClick={() => updateQuantity(cartKey, -1)} className="p-1.5 hover:text-red-500 transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-[11px] font-bold tabular-nums">{item.quantity}</span>
                            <button onClick={() => updateQuantity(cartKey, 1)} className="p-1.5 hover:text-emerald-600 transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {cart.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                    <ShoppingBag className="w-14 h-14 mb-3" />
                    <p className="font-medium text-sm">Carrinho vazio</p>
                  </div>
                )}
              </div>

              {/* Checkout Area */}
              {cart.length > 0 && (
                <div className="p-5 bg-white border-t border-gray-100 space-y-4">
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="O seu nome completo"
                      value={orderDetails.name}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    />
                    <input
                      type="tel"
                      placeholder="O seu WhatsApp (ex: 2449...)"
                      value={orderDetails.phone}
                      onChange={(e) => setOrderDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs focus:ring-2 focus:ring-black/10 outline-none transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-500 text-sm font-medium">Total</span>
                    <span className="text-xl font-black text-gray-900">{formatCurrency(cartTotal)}</span>
                  </div>

                  <button
                    onClick={checkoutWhatsApp}
                    disabled={checkoutLoading}
                    className="w-full py-4 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 active:scale-[0.97] transition-all disabled:opacity-50 hover:bg-emerald-700"
                  >
                    {checkoutLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Finalizar no WhatsApp
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 leading-relaxed">
                    O nosso assistente virtual enviará as coordenadas bancárias e acompanhará o seu pedido.
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ══════ WISHLIST DRAWER ══════ */}
      <AnimatePresence>
        {isWishlistOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsWishlistOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[111] shadow-2xl flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Lista de Desejos</h2>
                </div>
                <button onClick={() => setIsWishlistOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 active:scale-90 transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
                {Array.from(liked).map(id => {
                  const product = products.find(p => p.id === id);
                  if (!product) return null;
                  return (
                    <div key={id} className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 group">
                      <div
                        className="w-20 h-24 rounded-xl bg-white overflow-hidden flex-shrink-0 border border-gray-100 cursor-pointer"
                        onClick={() => { openProductDetail(product); setIsWishlistOpen(false); }}
                      >
                        {product.imagem ? (
                          <img src={product.imagem} className="w-full h-full object-contain" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{product.nome}</h4>
                        <p className="text-lg font-black text-red-600 mt-1">{formatCurrency(product.preco)}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => { openProductDetail(product); setIsWishlistOpen(false); }}
                            className="text-[10px] font-black uppercase tracking-widest text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm"
                          >
                            Ver Detalhes
                          </button>
                          <button
                             onClick={() => toggleLike(id)}
                             className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {liked.size === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300 py-32 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                       <Heart className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-black text-gray-900 tracking-tight">Nada por aqui ainda!</p>
                    <p className="text-xs text-gray-400 mt-2 max-w-[200px]">Guarde os seus produtos favoritos e compre-os mais tarde.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
