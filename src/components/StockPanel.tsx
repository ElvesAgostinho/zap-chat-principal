import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, TrendingDown, Edit2, Check, X, Plus, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Produto } from '@/types';
import { formatCurrency } from '@/data/mock';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface StockPanelProps {
  products: Produto[];
  onUpdate: () => void;
  onAddProduct?: () => void;
  onDeleteProduct?: (id: string) => void;
  onEditProduct?: (product: Produto) => void;
}

export default function StockPanel({ products, onUpdate, onAddProduct, onDeleteProduct, onEditProduct }: StockPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVariation, setEditingVariation] = useState<{ productId: string, index: number } | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const lowStock = products.filter(p => {
    if (p.variacoes && p.variacoes.length > 0) {
      return p.variacoes.some(v => v.estoque <= 5);
    }
    return p.estoque <= 5;
  });

  const outOfStock = products.filter(p => {
    if (p.variacoes && p.variacoes.length > 0) {
      return p.variacoes.every(v => v.estoque === 0);
    }
    return p.estoque === 0;
  });
  
  const sorted = useMemo(() => {
    return [...products].sort((a, b) => a.estoque - b.estoque);
  }, [products]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedProducts = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSaveStock = async (id: string) => {
    await (supabase as any).from('produtos').update({ estoque: editValue }).eq('id', id);
    toast.success('Estoque atualizado!');
    setEditingId(null);
    onUpdate();
  };

  const handleSaveVariationStock = async (productId: string, variationIndex: number, newValue: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variacoes) return;

    const newVariacoes = [...product.variacoes];
    newVariacoes[variationIndex] = { ...newVariacoes[variationIndex], estoque: newValue };

    // Update general stock as sum of variations
    const newTotalStock = newVariacoes.reduce((sum, v) => sum + (Number(v.estoque) || 0), 0);

    const { error } = await (supabase as any)
      .from('produtos')
      .update({ 
        variacoes: newVariacoes,
        estoque: newTotalStock 
      })
      .eq('id', productId);

    if (error) {
      toast.error('Erro ao atualizar stock da variação');
      return;
    }

    toast.success('Variedade atualizada!');
    setEditingVariation(null);
    onUpdate();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {onAddProduct && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold tracking-tight text-foreground">Gestão de Estoque</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1 opacity-70">Monitorização de Inventário</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddProduct} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-glow hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </motion.button>
        </div>
      )}

      {/* Stock Overview Cards */}

      {/* Alerts */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glassmorphism p-4 rounded-[28px] border-border/50 shadow-soft">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-2 rounded-xl ${outOfStock.length > 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground">Esgotados</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground tabular-nums">{outOfStock.length}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glassmorphism p-4 rounded-[28px] border-border/50 shadow-soft">
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`p-2 rounded-xl ${lowStock.length > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-secondary text-muted-foreground'}`}>
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-muted-foreground">Stock Baixo</span>
          </div>
          <p className="text-3xl font-display font-bold text-foreground tabular-nums">{lowStock.length}</p>
        </motion.div>
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {paginatedProducts.map(p => {
          const hasVariations = p.variacoes && p.variacoes.length > 0;
          const isExpanded = expandedId === p.id;

          return (
            <motion.div key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`glassmorphism rounded-3xl shadow-soft overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-glow/5 ${p.estoque === 0 ? 'border-destructive/30' : ''}`}>
              
              <div className="p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary overflow-hidden flex-shrink-0 cursor-pointer shadow-inner group border border-border/50" onClick={() => hasVariations && setExpandedId(isExpanded ? null : p.id)}>
                  {p.imagem ? <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> :
                    <div className="w-full h-full flex items-center justify-center bg-primary/5"><Package className="w-6 h-6 text-primary/20" /></div>}
                </div>
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => hasVariations && setExpandedId(isExpanded ? null : p.id)}>
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-display font-bold text-foreground truncate tracking-tight">{p.nome}</p>
                    {hasVariations && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase tracking-[0.1em] border border-emerald-500/20 shadow-sm">Multi-Variant</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-bold text-primary tabular-nums">{formatCurrency(p.preco)}</p>
                    {p.categoria && <span className="text-[9px] bg-primary/5 text-primary/70 px-2 py-0.5 rounded-lg font-bold uppercase tracking-tight border border-primary/10">{p.categoria}</span>}
                  </div>
                </div>

                {/* Stock Edit Area */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="text-right mr-2">
                    <p className={`text-sm font-bold tabular-nums ${p.estoque === 0 ? 'text-destructive' : p.estoque <= 5 ? 'text-amber-600' : 'text-foreground'}`}>
                      {p.estoque}
                    </p>
                    <p className="text-[8px] uppercase font-black text-muted-foreground opacity-40">Total</p>
                  </div>
                  
                  {!hasVariations && (
                    editingId === p.id ? (
                      <div className="flex items-center gap-1">
                        <Input type="number" value={editValue} onChange={e => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-sm text-center" min={0} autoFocus />
                        <button onClick={() => handleSaveStock(p.id)} className="p-1.5 rounded-lg bg-primary text-white shadow-glow"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(p.id); setEditValue(p.estoque); }} className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-all">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}

                  <div className="flex bg-secondary/50 rounded-xl p-1 border border-border/40 ml-1">
                    {onEditProduct && (
                      <button onClick={() => onEditProduct(p)} title="Editar Produto"
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteProduct && (
                      <button onClick={() => { if(confirm('Excluir \'' + p.nome + '\'?')) onDeleteProduct(p.id); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Variations Detail View */}
              <AnimatePresence>
                {isExpanded && hasVariations && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-border/40 bg-secondary/20 overflow-hidden">
                    <div className="p-4 space-y-3">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Stock por Cor e Tamanho</p>
                      <div className="grid grid-cols-1 gap-2">
                        {p.variacoes.map((v, idx) => (
                          <div key={idx} className="bg-card p-3 rounded-xl border border-border/40 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-bold">
                                {v.imagem ? <img src={v.imagem} className="w-full h-full object-cover rounded-lg" /> : <Package className="w-4 h-4 text-muted-foreground/30" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">{v.cor || 'Sem Cor'} · {v.tamanho || 'Sem Tam'}</p>
                                {v.preco > 0 && <p className="text-[10px] text-primary font-bold">{formatCurrency(v.preco)}</p>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {editingVariation?.productId === p.id && editingVariation?.index === idx ? (
                                <div className="flex items-center gap-1">
                                  <Input type="number" defaultValue={v.estoque} 
                                    onBlur={(e) => handleSaveVariationStock(p.id, idx, parseInt(e.target.value) || 0)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveVariationStock(p.id, idx, parseInt((e.target as any).value) || 0)}
                                    className="w-16 h-8 text-xs text-center" autoFocus />
                                </div>
                              ) : (
                                <button onClick={() => setEditingVariation({ productId: p.id, index: idx })} 
                                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 group-hover:border-primary/30 border border-transparent transition-all">
                                  <span className={`text-xs font-bold tabular-nums ${v.estoque <= 5 ? 'text-amber-600' : 'text-foreground'}`}>{v.estoque}</span>
                                  <Edit2 className="w-3 h-3 text-muted-foreground opacity-40" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {products.length === 0 && (
          <div className="text-center py-20 bg-background/50 rounded-3xl border-2 border-dashed border-border/40">
            <Package className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nenhum produto em catálogo</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Página <span className="text-foreground">{currentPage} de {totalPages}</span></p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-secondary hover:bg-secondary/70 disabled:opacity-30 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-secondary hover:bg-secondary/70 disabled:opacity-30 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
