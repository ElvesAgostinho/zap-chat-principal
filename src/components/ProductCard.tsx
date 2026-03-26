import { motion } from 'framer-motion';
import { Produto } from '@/types';
import { formatCurrency } from '@/data/mock';
import { Trash2, Package, AlertTriangle } from 'lucide-react';

interface ProductCardProps { product: Produto; onDelete?: (id: string) => void; }

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const lowStock = product.estoque <= 3;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group flex gap-4 items-center shadow-sm"
    >
      <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
        {product.imagem ? <img src={product.imagem} alt={product.nome} className="object-cover w-full h-full" /> : <Package className="w-6 h-6 text-slate-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-white truncate text-sm">{product.nome}</h3>
          {product.categoria && (
            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                {product.categoria}
            </span>
          )}
        </div>
        <p className="text-base font-bold text-primary mb-2 tracking-tight">{formatCurrency(product.preco)}</p>
        
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${lowStock ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
          <p className={`text-[10px] font-bold uppercase tracking-wider ${lowStock ? 'text-amber-500' : 'text-slate-500'}`}>
            {product.estoque} em stock
          </p>
        </div>
      </div>
      {onDelete && (
        <button 
            onClick={() => onDelete(product.id)} 
            className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        >
            <Trash2 className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
