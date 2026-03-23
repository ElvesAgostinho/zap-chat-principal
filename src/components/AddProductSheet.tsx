import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2 } from 'lucide-react';
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
  const [attrs, setAttrs] = useState<{ key: string, value: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.nome || '');
      setPrice(initialData.preco?.toString() || '');
      setImageUrl(initialData.imagem || '');
      setImagePreview(initialData.imagem || '');
      setStock(initialData.estoque?.toString() || '1');
      setCost(initialData.custo_unitario?.toString() || '0');
      setCategory(initialData.categoria || '');
      if (initialData.atributos) {
        setAttrs(Object.entries(initialData.atributos).map(([key, value]) => ({ key, value: String(value) })));
      } else {
        setAttrs([]);
      }
    } else if (open && !initialData) {
      setName(''); setPrice(''); setImageUrl(''); setImagePreview(''); setStock('1'); setCost('0'); setCategory(''); setAttrs([]); setSelectedFile(null);
    }
  }, [open, initialData]);

  const handleAddField = () => {
    setAttrs([...attrs, { key: '', value: '' }]);
  };

  const updateAttr = (index: number, f: 'key' | 'value', val: string) => {
    const next = [...attrs];
    next[index][f] = val;
    setAttrs(next);
  };

  const removeAttr = (index: number) => {
    setAttrs(attrs.filter((_, i) => i !== index));
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

    // Upload file to Supabase Storage if a file was selected
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

    // Process attributes into a JSON object
    const atributosObj: Record<string, string> = {};
    attrs.forEach(a => {
      if (a.key.trim() && a.value.trim()) {
        atributosObj[a.key.trim().toLowerCase()] = a.value.trim();
      }
    });

    const productData = {
      loja_id: storeId, 
      nome: name, 
      preco: parseFloat(price), 
      imagem: finalImageUrl, 
      estoque: parseInt(stock) || 1, 
      custo_unitario: parseFloat(cost) || 0,
      categoria: category.trim() || 'Geral',
      atributos: atributosObj,
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
    if (error) { toast.error(initialData ? 'Erro ao atualizar produto' : 'Erro ao adicionar produto'); return; }
    toast.success(initialData ? 'Produto atualizado!' : 'Produto adicionado!');
    setName(''); setPrice(''); setImageUrl(''); setImagePreview(''); setStock('1'); setCategory(''); setAttrs([]); setSelectedFile(null);
    onAdded(); onClose();
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[100]" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl max-w-lg mx-auto shadow-elevated h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40 shrink-0">
              <h2 className="text-display text-lg">{initialData ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-secondary transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 pb-12 scrollbar-thin">
              <div><label className="text-metadata mb-1.5 block">Nome do Produto</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Bota de Couro ou Camisa Social" className={inputClass} /></div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest"><label className="mb-1.5 block">Preço (Kz)</label><input value={price} onChange={e => setPrice(e.target.value)} type="number" step="1" placeholder="0" className={inputClass} /></div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest"><label className="mb-1.5 block">Custo (Kz)</label><input value={cost} onChange={e => setCost(e.target.value)} type="number" step="1" placeholder="0" className={inputClass} /></div>
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest"><label className="mb-1.5 block">Estoque</label><input value={stock} onChange={e => setStock(e.target.value)} type="number" placeholder="1" className={inputClass} /></div>
              </div>

              <div>
                <label className="text-metadata mb-1.5 block">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
                  <option value="">Selecione ou digite abaixo</option>
                  <option value="Calçados">Calçados</option>
                  <option value="Roupas">Roupas</option>
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Acessórios">Acessórios</option>
                  <option value="Alimentação">Alimentação</option>
                </select>
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ou digite nova categoria..." className={inputClass + ' mt-2'} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-metadata">Atributos Flexíveis</label>
                  <button onClick={handleAddField} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-lg font-bold hover:bg-primary/20 transition-all">+ Novo Atributo</button>
                </div>
                <p className="text-[10px] text-muted-foreground mb-3 leading-tight">Adicione informações como Tamanho, Cor, Voltagem, Edição, etc. Isso ajuda o robô a vender melhor!</p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {attrs.map((at, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="flex gap-2 items-center">
                        <input value={at.key} onChange={e => updateAttr(idx, 'key', e.target.value)} placeholder="Ex: Tamanho" className={inputClass + ' text-xs h-10 w-1/3'} />
                        <input value={at.value} onChange={e => updateAttr(idx, 'value', e.target.value)} placeholder="Ex: 42 ou XL" className={inputClass + ' text-xs h-10 flex-1'} />
                        <button onClick={() => removeAttr(idx)} className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div>
                <label className="text-metadata mb-1.5 block">Foto</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-secondary border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button onClick={() => { setImagePreview(''); setImageUrl(''); setSelectedFile(null); }} className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 text-white backdrop-blur-md shadow-lg"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-2xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"><Upload className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Enviar foto</span></motion.button>
                    <div className="flex flex-col gap-2">
                      <input value={imageUrl} onChange={e => { setImageUrl(e.target.value); setImagePreview(e.target.value); setSelectedFile(null); }} placeholder="URL da imagem..." className={inputClass + ' text-xs'} />
                      <p className="text-[9px] text-muted-foreground px-1 leading-tight">Prefira fotos reais para aumentar a confiança do cliente.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!name || !price || saving} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-sm disabled:opacity-40 shadow-glow">
                  {uploading ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Processando...</span> : saving ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Adicionar Produto'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
