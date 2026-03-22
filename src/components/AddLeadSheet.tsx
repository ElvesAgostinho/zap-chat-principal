import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AddLeadSheetProps {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
}

const sources = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Outro' },
];

export default function AddLeadSheet({ open, onClose, storeId }: AddLeadSheetProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [fonte, setFonte] = useState('whatsapp');
  const [interesse, setInteresse] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nome || !telefone || !storeId) return;
    setSaving(true);
    const { error } = await (supabase as any).from('leads').insert({
      loja_id: storeId, nome, telefone, email: email || null, fonte, interesse: interesse || null, notas: notas || null, status: 'novo',
    });
    setSaving(false);
    if (error) { toast.error('Erro ao adicionar lead'); return; }
    toast.success('Lead adicionado!');
    setNome(''); setTelefone(''); setEmail(''); setFonte('whatsapp'); setInteresse(''); setNotas('');
    onClose();
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 max-w-lg mx-auto shadow-elevated max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-display text-lg">Novo Lead</h2>
              <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="text-metadata mb-1.5 block">Nome *</label><input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do contato" className={inputClass} /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="text-metadata mb-1.5 block">Telefone *</label><input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="+244 9XX XXX XXX" className={inputClass} /></div>
                <div className="flex-1"><label className="text-metadata mb-1.5 block">E-mail</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..." className={inputClass} /></div>
              </div>
              <div>
                <label className="text-metadata mb-1.5 block">Origem</label>
                <div className="flex gap-2 flex-wrap">
                  {sources.map(s => (
                    <button key={s.value} onClick={() => setFonte(s.value)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${fonte === s.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div><label className="text-metadata mb-1.5 block">Interesse</label><input value={interesse} onChange={e => setInteresse(e.target.value)} placeholder="Ex: Bota de Couro" className={inputClass} /></div>
              <div><label className="text-metadata mb-1.5 block">Observações</label><textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas..." rows={2} className={inputClass + ' resize-none'} /></div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!nome || !telefone || saving} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40">
                {saving ? 'Salvando...' : 'Adicionar Lead'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
