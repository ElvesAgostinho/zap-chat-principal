import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, Plus, Minus, X, ChevronRight, Loader2, Store, ShoppingCart, Heart, Share2, ChevronLeft, Palette, Ruler, Trash2 } from 'lucide-react';
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
  const { storeCode } = useParams<{ storeCode: string }>();
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
    const attrs = getAtributos(product);
    setSelectedProduct(product);
    setSelectedColor(attrs.cores?.[0] || '');
    setSelectedSize(attrs.tamanhos?.[0] || '');
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
                  {(hasColors || hasSizes) && (
                    <div className="absolute bottom-2 left-2 flex gap-1">
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
          const attrs = getAtributos(selectedProduct);
          const hasColors = attrs.cores && attrs.cores.length > 0;
          const hasSizes = attrs.tamanhos && attrs.tamanhos.length > 0;
          const isLiked = liked.has(selectedProduct.id);
          const isOutOfStock = selectedProduct.estoque <= 0;

          return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                className="fixed inset-x-0 bottom-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl md:h-[85vh] bg-white z-[101] rounded-t-[2.5rem] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: '94vh' }}
              >
                {/* Modal Header — Integrated Style */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                  <button onClick={() => setSelectedProduct(null)} className="p-2.5 rounded-full bg-white/90 shadow-lg backdrop-blur-sm pointer-events-auto hover:bg-white transition-all transform active:scale-95">
                    <ChevronLeft className="w-5 h-5 text-gray-800" />
                  </button>
                  <div className="flex gap-2 pointer-events-auto">
                    <button
                      onClick={() => toggleLike(selectedProduct.id)}
                      className={`p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all transform active:scale-95 ${
                        isLiked ? 'bg-red-50 text-red-500' : 'bg-white/90 text-gray-800'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('Link copiado!');
                      }}
                      className="p-2.5 rounded-full bg-white/90 shadow-lg backdrop-blur-sm text-gray-800 hover:bg-white transition-all transform active:scale-95"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar pt-0">
                  {/* HERO IMAGE — Fills the top nicely */}
                  <div className="relative aspect-[3/4] md:aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
                    {selectedProduct.imagem ? (
                      <img
                        src={selectedProduct.imagem}
                        alt={selectedProduct.nome}
                        className="w-full h-full object-contain md:object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
                        <ShoppingBag className="w-20 h-20 mb-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sem Imagem</span>
                      </div>
                    )}
                    {/* Shadow overlay for name visibility if it was on top (not using now but good for future) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>

                  {/* INFO PANEL */}
                  <div className="px-6 py-8 space-y-8 bg-white -mt-8 rounded-t-[2.5rem] relative z-20">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-white bg-black px-2 py-0.5 rounded tracking-tighter uppercase">Original</span>
                         {selectedProduct.estoque > 0 && selectedProduct.estoque <= 3 && (
                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded tracking-tighter uppercase">Últimas Unidades ({selectedProduct.estoque})</span>
                         )}
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{selectedProduct.nome}</h2>
                      <div className="flex items-center gap-4">
                        <span className="text-3xl font-black text-red-600 tracking-tight">{formatCurrency(selectedProduct.preco)}</span>
                        {!isOutOfStock ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Disponível em Stock</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider">Esgotado</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description Section */}
                    {selectedProduct.descricao && (
                      <div className="p-4 bg-gray-50/50 rounded-2xl">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Informações do Produto</h4>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{selectedProduct.descricao}</p>
                      </div>
                    )}

                    {/* Variations Grid */}
                    <div className="space-y-6">
                      {/* COLORS Selector */}
                      {hasColors && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Palette className="w-3.5 h-3.5" /> Escolher Cor
                            </h4>
                            <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded italic">{selectedColor || 'Nenhuma'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {attrs.cores!.map(cor => {
                              // Stock logic per color if variacoes exists
                              const varStock = attrs.variacoes?.find(v => v.cor === cor)?.estoque;
                              const isColorOut = varStock !== undefined && varStock <= 0;

                              return (
                                <button
                                  key={cor}
                                  disabled={isColorOut}
                                  onClick={() => setSelectedColor(cor)}
                                  className={`px-5 py-3 rounded-xl text-xs font-black transition-all border-2 relative overflow-hidden ${
                                    selectedColor === cor
                                      ? 'border-black bg-black text-white shadow-lg scale-105'
                                      : isColorOut
                                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                        : 'border-gray-100 bg-white text-gray-600 hover:border-black active:scale-95'
                                  }`}
                                >
                                  {cor}
                                  {isColorOut && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><X className="w-4 h-4 text-red-500 opacity-50" /></div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SIZES Selector */}
                      {hasSizes && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <Ruler className="w-3.5 h-3.5" /> Tamanho Disponível
                            </h4>
                            <span className="text-[10px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded italic">{selectedSize || 'Nenhuma'}</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {attrs.tamanhos!.map(tam => {
                              // Stock logic per size if variacoes exists (linking to selectedColor)
                              const varStock = attrs.variacoes?.find(v => v.tamanho === tam && (!selectedColor || v.cor === selectedColor))?.estoque;
                              const isSizeOut = varStock !== undefined && varStock <= 0;

                              return (
                                <button
                                  key={tam}
                                  disabled={isSizeOut}
                                  onClick={() => setSelectedSize(tam)}
                                  className={`min-w-[56px] h-14 rounded-xl text-xs font-black transition-all border-2 relative overflow-hidden ${
                                    selectedSize === tam
                                      ? 'border-black bg-black text-white shadow-lg scale-105'
                                      : isSizeOut
                                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                        : 'border-gray-100 bg-white text-gray-600 hover:border-black active:scale-95'
                                  }`}
                                >
                                  {tam}
                                  {isSizeOut && <div className="absolute inset-0 flex items-center justify-center bg-white/60"><X className="w-4 h-4 text-red-500 opacity-50" /></div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CALL TO ACTION — Sticky Bottom */}
                <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-xl flex gap-3">
                  <button
                    disabled={isOutOfStock}
                    onClick={() => addToCart(selectedProduct, selectedColor || undefined, selectedSize || undefined)}
                    className="flex-1 py-4.5 rounded-2xl bg-black text-white font-black text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-gray-800 disabled:opacity-40 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-xl shadow-black/10 h-14"
                  >
                    {isOutOfStock ? (
                      <span className="uppercase tracking-[0.1em]">Esgotado Temporariamente</span>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>ADICIONAR À SACOLA</span>
                      </>
                    )}
                  </button>
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
