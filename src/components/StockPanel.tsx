import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  const [editValue, setEditValue] = useState(0);

  const lowStock = products.filter(p => p.estoque <= 5);
  const outOfStock = products.filter(p => p.estoque === 0);
  
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      {onAddProduct && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Gestão de Estoque</h2>
            <p className="text-xs text-muted-foreground mt-1">Gerencie produtos e quantidades do catálogo</p>
          </div>
          <button onClick={onAddProduct} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-white text-xs font-bold shadow-glow hover:scale-105 transition-all">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      )}

      {/* Stock Overview Cards */}

      {/* Alerts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card p-3 rounded-2xl shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className={`w-4 h-4 ${outOfStock.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Esgotados</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{outOfStock.length}</p>
        </div>
        <div className="bg-card p-3 rounded-2xl shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className={`w-4 h-4 ${lowStock.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Stock Baixo</span>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{lowStock.length}</p>
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-2">
        {paginatedProducts.map(p => (
          <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`bg-card rounded-2xl p-3 shadow-card flex items-center gap-3 ${p.estoque === 0 ? 'ring-2 ring-destructive/30' : p.estoque <= 5 ? 'ring-1 ring-amber-300/50' : ''}`}>
            <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
              {p.imagem ? <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/30" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{p.nome}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-black text-primary">{formatCurrency(p.preco)}</p>
                {p.categoria && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">{p.categoria}</span>}
              </div>
              {p.atributos && Object.keys(p.atributos).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {Object.entries(p.atributos).slice(0, 2).map(([k, v]) => (
                    <span key={k} className="text-[8px] bg-muted/80 px-1.2 py-0.5 rounded text-muted-foreground uppercase font-bold border border-border/20">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {editingId === p.id ? (
              <div className="flex items-center gap-1">
                <Input type="number" value={editValue} onChange={e => setEditValue(parseInt(e.target.value) || 0)}
                  className="w-16 h-8 text-sm text-center" min={0} />
                <button onClick={() => handleSaveStock(p.id)} className="p-1.5 rounded-lg bg-primary/10 text-primary"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <span className={`text-sm font-bold tabular-nums mr-1 sm:mr-2 ${p.estoque === 0 ? 'text-destructive' : p.estoque <= 5 ? 'text-amber-600' : 'text-foreground'}`}>
                  {p.estoque} <span className="text-[10px] uppercase font-semibold text-muted-foreground ml-0.5 opacity-60">Qtd</span>
                </span>
                <div className="flex bg-secondary/50 rounded-xl p-1 border border-border/40">
                  <button onClick={() => { setEditingId(p.id); setEditValue(p.estoque); }} title="Editar Estoque"
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {onEditProduct && (
                    <button onClick={() => onEditProduct(p)} title="Editar Detalhes do Produto"
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDeleteProduct && (
                    <button onClick={() => { if(confirm('Tem certeza que deseja excluir \'' + p.nome + '\'?')) onDeleteProduct(p.id); }} title="Excluir Produto"
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto cadastrado</p>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Mostrando <span className="font-bold text-foreground">{paginatedProducts.length}</span> de <span className="font-bold text-foreground">{sorted.length}</span></p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 disabled:opacity-50 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold w-10 text-center">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 disabled:opacity-50 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
