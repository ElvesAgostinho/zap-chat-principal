import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Plus, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Produto } from '@/types';

interface AddProductSheetProps {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
  onAdded: () => void;
  initialData?: Produto | null;
}

interface VariacaoTemp {
  id: string;
  cor: string;
  tamanho: string;
  estoque: number;
  preco: number;
  imagem: string;
}

async function uploadImageToStorage(file: File, storeId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return urlData?.publicUrl || null;
}

export default function AddProductSheet({ open, onClose, storeId, onAdded, initialData }: AddProductSheetProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stock, setStock] = useState('1');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cost, setCost] = useState('');
  const [category, setCategory] = useState('');
  const [variacoes, setVariacoes] = useState<VariacaoTemp[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (variacoes.length > 0) {
      const total = variacoes.reduce((sum, v) => sum + (Number(v.estoque) || 0), 0);
      setStock(total.toString());
    }
  }, [variacoes]);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.nome || '');
      setPrice(initialData.preco?.toString() || '');
      setImageUrl(initialData.imagem || '');
      setImagePreview(initialData.imagem || '');
      setStock(initialData.estoque?.toString() || '1');
      setCost(initialData.custo_unitario?.toString() || '0');
      setCategory(initialData.categoria || '');
      
      if (initialData.variacoes && Array.isArray(initialData.variacoes)) {
        setVariacoes(initialData.variacoes.map((v: any) => ({
          id: Math.random().toString(),
          cor: v.cor || '',
          tamanho: v.tamanho || '',
          estoque: v.estoque || 0,
          preco: v.preco || 0,
          imagem: v.imagem || ''
        })));
      } else {
        setVariacoes([]);
      }
    } else if (open && !initialData) {
      setName(''); setPrice(''); setImageUrl(''); setImagePreview(''); setStock('1'); setCost('0'); setCategory(''); setVariacoes([]); setSelectedFile(null);
    }
  }, [open, initialData]);

  const handleAddVariacao = () => {
    setVariacoes([...variacoes, { id: Math.random().toString(), cor: '', tamanho: '', estoque: 1, preco: parseFloat(price) || 0, imagem: '' }]);
  };

  const updateVariacao = (id: string, field: keyof VariacaoTemp, value: any) => {
    setVariacoes(variacoes.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariacao = (id: string) => {
    setVariacoes(variacoes.filter(v => v.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageUrl(''); // will be set after upload
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name || !price || !storeId) return;
    setSaving(true);

    let finalImageUrl = imageUrl || null;

    if (selectedFile) {
      setUploading(true);
      const publicUrl = await uploadImageToStorage(selectedFile, storeId);
      setUploading(false);
      if (publicUrl) {
        finalImageUrl = publicUrl;
      } else {
        toast.error('Erro ao enviar foto. Tente novamente.');
        setSaving(false);
        return;
      }
    }

    // Clean up variations for DB
    const finalVariacoes = variacoes.map(v => ({
      cor: v.cor.trim(),
      tamanho: v.tamanho.trim(),
      estoque: Number(v.estoque) || 0,
      preco: Number(v.preco) || 0,
      imagem: v.imagem.trim() || null
    })).filter(v => v.cor || v.tamanho); // Apenas guarda variações que tenham cor ou tamanho definidos

    const productData = {
      loja_id: storeId, 
      nome: name, 
      preco: parseFloat(price), 
      imagem: finalImageUrl, 
      estoque: parseInt(stock) || 1, 
      custo_unitario: parseFloat(cost) || 0,
      categoria: category.trim() || 'Geral',
      variacoes: finalVariacoes,
      atributos: {} // Mantido vazio para retrocompatibilidade
    };

    let error;
    if (initialData?.id) {
      const res = await (supabase as any).from('produtos').update(productData).eq('id', initialData.id);
      error = res.error;
    } else {
      const res = await (supabase as any).from('produtos').insert(productData);
      error = res.error;
    }

    setSaving(false);
    if (error) { 
      console.error(error);
      toast.error('Erro de gravação. Verifique a ligação.'); 
      return; 
    }
    
    toast.success(initialData ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
    onAdded(); 
    onClose();
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';
  const smallInputClass = 'w-full px-3 py-2 rounded-lg bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-xs';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100]" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl max-w-2xl mx-auto shadow-elevated h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40 shrink-0">
              <h2 className="text-display text-lg">{initialData ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6 pb-24 scrollbar-thin">
              
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                  Informações Básicas
                </h3>
                
                <div><label className="text-metadata mb-1.5 block">Nome do Produto *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Vestido Floral Premium" className={inputClass} /></div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest"><label className="mb-1.5 block">Preço Base (Kz) *</label><input value={price} onChange={e => setPrice(e.target.value)} type="number" step="1" placeholder="0" className={inputClass} /></div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                    <label className="mb-1.5 block">Estoque Geral</label>
                    <input 
                      value={stock} 
                      onChange={e => setStock(e.target.value)} 
                      type="number" 
                      placeholder="1" 
                      className={`${inputClass} ${variacoes.length > 0 ? 'opacity-50 cursor-not-allowed bg-secondary/30' : ''}`} 
                      readOnly={variacoes.length > 0} 
                    />
                  </div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest"><label className="mb-1.5 block">Categoria</label><input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Vestidos" className={inputClass} /></div>
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest"><label className="mb-1.5 block">Custo (Kz)</label><input value={cost} onChange={e => setCost(e.target.value)} type="number" step="1" placeholder="0" className={inputClass} /></div>
                </div>
              </div>

              {/* Variações (SHEIN Style) */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                    Variações de Cor e Tamanho
                  </h3>
                  <button onClick={handleAddVariacao} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-bold hover:brightness-110 shadow-glow transition-all flex items-center gap-1"><Plus className="w-3.5 h-3.5"/> Adicionar</button>
                </div>
                
                <p className="text-[11px] text-muted-foreground leading-relaxed">Crie combinações para o seu produto (ex: Cor Vermelha, Tamanho M). Cada variação permite estipular um estoque e foto exclusivos.</p>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {variacoes.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center gap-2">
                        <p className="text-sm font-medium text-muted-foreground">Produto simples (sem variações)</p>
                        <p className="text-xs text-muted-foreground/60 max-w-[250px]">O estoque geral ({stock}) será usado. Adicione variações se este produto tiver cores ou tamanhos diferentes.</p>
                      </motion.div>
                    )}
                    {variacoes.map((v) => (
                      <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="p-3.5 rounded-xl bg-secondary/40 border border-border/60 relative group">
                        <button onClick={() => removeVariacao(v.id)} className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3"/></button>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <div><label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Cor</label><input value={v.cor} onChange={e => updateVariacao(v.id, 'cor', e.target.value)} placeholder="Ex: Azul Escuro" className={smallInputClass} /></div>
                          <div><label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Tamanho</label><input value={v.tamanho} onChange={e => updateVariacao(v.id, 'tamanho', e.target.value)} placeholder="Ex: XL" className={smallInputClass} /></div>
                          <div><label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Qtd Estoque</label><input value={v.estoque} onChange={e => updateVariacao(v.id, 'estoque', e.target.value)} type="number" className={smallInputClass} /></div>
                          <div><label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">Preço (Opcional)</label><input value={v.preco} onChange={e => updateVariacao(v.id, 'preco', e.target.value)} type="number" placeholder="Opcional" className={smallInputClass} /></div>
                          <div><label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">URL Imagem (Opcional)</label><input value={v.imagem} onChange={e => updateVariacao(v.id, 'imagem', e.target.value)} placeholder="https://..." className={smallInputClass} /></div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mídia Base */}
              <div className="space-y-4 pt-4 border-t border-border/40">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                  Foto Principal
                </h3>
                
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-full md:w-1/2 h-48 rounded-2xl overflow-hidden bg-secondary border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => { setImagePreview(''); setImageUrl(''); setSelectedFile(null); }} className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 text-white backdrop-blur-md shadow-lg hover:bg-black/80 transition-all"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-3 px-4 py-10 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all">
                      <ImageIcon className="w-8 h-8 opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-widest">Enviar do Computador</span>
                    </motion.button>
                    <div className="flex flex-col gap-2 justify-center">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ou cole uma URL</p>
                      <input value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); setSelectedFile(null); }} placeholder="https://..." className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border/40 shadow-up">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!name || !price || saving} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm disabled:opacity-40 shadow-glow">
                {uploading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Fazendo Upload...</span> : saving ? 'Salvando na Base de Dados...' : initialData ? 'Salvar Alterações do Produto' : 'Cadastrar Produto no Catálogo'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

