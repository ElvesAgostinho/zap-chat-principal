import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, CreditCard, MapPin, Bot, Plus, X, Power, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import WhatsAppConnectionPanel from '@/components/WhatsAppConnectionPanel';

const IDIOMAS = [
  { value: 'pt-AO', label: '🇦🇴 Português (Angola)' },
  { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
  { value: 'pt-PT', label: '🇵🇹 Português (Portugal)' },
  { value: 'pt-MZ', label: '🇲🇿 Português (Moçambique)' },
  { value: 'pt-ST', label: '🇸🇹 Português (São Tomé)' },
];

interface Config { nomeLoja: string; telefone: string; endereco: string; formasPagamento: string[]; zonasEntrega: string[]; mensagemBoasVindas: string; linguagemBot: string; idioma: string; }

export default function StoreConfigPanel() {
  const { storeId } = useAuth();
  const [config, setConfig] = useState<Config>({ nomeLoja: '', telefone: '', endereco: '', formasPagamento: [], zonasEntrega: [], mensagemBoasVindas: '', linguagemBot: '', idioma: 'pt-AO' });
  const [newPayment, setNewPayment] = useState('');
  const [newZone, setNewZone] = useState('');
  const [botActive, setBotActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) { setLoading(false); return; }
    (supabase as any).from('lojas').select('nome, telefone, endereco, mensagem_boas_vindas, linguagem_bot, zonas_entrega, formas_pagamento, bot_ativo, idioma').eq('id', storeId).maybeSingle()
      .then(({ data }: any) => {
        if (data) {
          setBotActive(data.bot_ativo !== false);
          setConfig({ nomeLoja: data.nome || '', telefone: data.telefone || '', endereco: data.endereco || '', mensagemBoasVindas: data.mensagem_boas_vindas || '', linguagemBot: data.linguagem_bot || '', zonasEntrega: data.zonas_entrega || [], formasPagamento: data.formas_pagamento || [], idioma: data.idioma || 'pt-AO' });
        }
        setLoading(false);
      });
  }, [storeId]);

  const toggleBot = async () => {
    if (!storeId) return;
    const val = !botActive; setBotActive(val);
    const { error } = await (supabase as any).from('lojas').update({ bot_ativo: val }).eq('id', storeId);
    if (error) { toast.error('Erro'); setBotActive(!val); } else toast.success(val ? 'Bot activado!' : 'Bot desactivado!');
  };

  const save = async () => {
    if (!storeId) return;
    await (supabase as any).from('lojas').update({
      nome: config.nomeLoja, telefone: config.telefone, endereco: config.endereco,
      mensagem_boas_vindas: config.mensagemBoasVindas, linguagem_bot: config.linguagemBot,
      formas_pagamento: config.formasPagamento, zonas_entrega: config.zonasEntrega,
      idioma: config.idioma,
    }).eq('id', storeId);
    toast.success('Configurações salvas!');
  };

  return (
    <div className="space-y-4">
      <WhatsAppConnectionPanel />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3">
        <div className="flex items-center gap-2"><Store className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Dados da Loja</h3></div>
        <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Nome</label><Input value={config.nomeLoja} onChange={e => setConfig(p => ({ ...p, nomeLoja: e.target.value }))} /></div>
        <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Telefone</label><Input value={config.telefone} onChange={e => setConfig(p => ({ ...p, telefone: e.target.value }))} /></div>
        <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Endereço</label><Input value={config.endereco} onChange={e => setConfig(p => ({ ...p, endereco: e.target.value }))} /></div>
      </motion.div>

      {/* Idioma */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3">
        <div className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Idioma do Bot</h3></div>
        <div className="grid grid-cols-1 gap-2">
          {IDIOMAS.map(lang => (
            <button key={lang.value} onClick={() => setConfig(p => ({ ...p, idioma: lang.value }))}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all ${config.idioma === lang.value ? 'bg-primary/10 ring-2 ring-primary font-medium text-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
              {lang.label}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3">
        <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Pagamentos</h3></div>
        <div className="flex flex-wrap gap-2">{config.formasPagamento.map((p, i) => (<span key={i} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm text-foreground">{p}<button onClick={() => setConfig(c => ({ ...c, formasPagamento: c.formasPagamento.filter((_, idx) => idx !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button></span>))}</div>
        <div className="flex gap-2"><Input value={newPayment} onChange={e => setNewPayment(e.target.value)} placeholder="Nova forma" className="text-sm" onKeyDown={e => { if (e.key === 'Enter' && newPayment.trim()) { setConfig(c => ({ ...c, formasPagamento: [...c.formasPagamento, newPayment.trim()] })); setNewPayment(''); }}} /><button onClick={() => { if (newPayment.trim()) { setConfig(c => ({ ...c, formasPagamento: [...c.formasPagamento, newPayment.trim()] })); setNewPayment(''); }}} className="p-2 rounded-xl bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3">
        <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Zonas de Entrega</h3></div>
        <div className="flex flex-wrap gap-2">{config.zonasEntrega.map((z, i) => (<span key={i} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm text-foreground">{z}<button onClick={() => setConfig(c => ({ ...c, zonasEntrega: c.zonasEntrega.filter((_, idx) => idx !== i) }))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button></span>))}</div>
        <div className="flex gap-2"><Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="Nova zona" className="text-sm" onKeyDown={e => { if (e.key === 'Enter' && newZone.trim()) { setConfig(c => ({ ...c, zonasEntrega: [...c.zonasEntrega, newZone.trim()] })); setNewZone(''); }}} /><button onClick={() => { if (newZone.trim()) { setConfig(c => ({ ...c, zonasEntrega: [...c.zonasEntrega, newZone.trim()] })); setNewZone(''); }}} className="p-2 rounded-xl bg-primary text-primary-foreground"><Plus className="w-4 h-4" /></button></div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-4">
        <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Bot</h3></div>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: botActive ? 'linear-gradient(135deg, #075E54, #128C7E)' : undefined, backgroundColor: botActive ? undefined : 'hsl(var(--secondary))' }}>
          <div className="flex items-center gap-3">
            <Power className={`w-5 h-5 ${botActive ? 'text-white' : 'text-muted-foreground'}`} />
            <div><p className={`text-sm font-semibold ${botActive ? 'text-white' : 'text-foreground'}`}>Bot de Vendas</p><p className={`text-[11px] ${botActive ? 'text-white/70' : 'text-muted-foreground'}`}>{botActive ? 'Respondendo automaticamente' : 'Desactivado'}</p></div>
          </div>
          <Switch checked={botActive} onCheckedChange={toggleBot} />
        </div>
        <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Mensagem de boas-vindas</label><Textarea value={config.mensagemBoasVindas} onChange={e => setConfig(p => ({ ...p, mensagemBoasVindas: e.target.value }))} className="text-sm" /></div>
        <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Tom do Bot</label><Input value={config.linguagemBot} onChange={e => setConfig(p => ({ ...p, linguagemBot: e.target.value }))} className="text-sm" /></div>
      </motion.div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm">Salvar Configurações</motion.button>
    </div>
  );
}
