import { motion } from 'framer-motion';
import { Produto } from '@/types';
import { formatCurrency } from '@/data/mock';
import { Trash2, Package, AlertTriangle } from 'lucide-react';

interface ProductCardProps { product: Produto; onDelete?: (id: string) => void; }

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const lowStock = product.estoque <= 3;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card p-3 rounded-xl shadow-card border border-border/50 flex gap-3 items-center hover:shadow-elevated transition-shadow"
    >
      <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
        {product.imagem ? <img src={product.imagem} alt={product.nome} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground/40" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-bold text-foreground truncate text-[13px]">{product.nome}</h3>
          {product.categoria && <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">{product.categoria}</span>}
        </div>
        <p className="text-sm font-black text-primary mb-1">{formatCurrency(product.preco)}</p>
        
        {product.atributos && Object.keys(product.atributos).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {Object.entries(product.atributos).slice(0, 3).map(([k, v]) => (
              <span key={k} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground border border-border/40">
                <span className="font-bold uppercase opacity-60 mr-1">{k}:</span>{v}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1">
          {lowStock ? <AlertTriangle className="w-3 h-3 text-orange-500 fill-orange-500/10" /> : <Package className="w-3 h-3 text-muted-foreground/30" />}
          <p className={`text-[10px] ${lowStock ? 'text-orange-600 font-bold uppercase tracking-tight' : 'text-muted-foreground font-medium'}`}>{product.estoque} disponíve{product.estoque === 1 ? 'l' : 'is'}</p>
        </div>
      </div>
      {onDelete && (
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onDelete(product.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></motion.button>
      )}
    </motion.div>
  );
}
