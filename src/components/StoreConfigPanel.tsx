import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, CreditCard, MapPin, Bot, Plus, X, Power, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const IDIOMAS = [
  { value: 'pt-AO', label: '🇦🇴 Português (Angola)' },
  { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
  { value: 'pt-PT', label: '🇵🇹 Português (Portugal)' },
  { value: 'pt-MZ', label: '🇲🇿 Português (Moçambique)' },
  { value: 'pt-ST', label: '🇸🇹 Português (São Tomé)' },
];

interface PaymentMethod { id?: string; tipo: string; detalhes: string; is_active: boolean; }
interface DeliveryZone { id?: string; zona: string; taxa: number; is_active: boolean; }

const slugify = (text: string) => {
  if (!text) return '';
  return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
};

interface Config { 
  nomeLoja: string; 
  telefone: string; 
  endereco: string; 
  formasPagamento: PaymentMethod[]; 
  zonasEntrega: DeliveryZone[]; 
  mensagemBoasVindas: string; 
  linguagemBot: string; 
  idioma: string; 
  tomVoz: string;
  politicaAgendamento: string;
  slug?: string;
}

export default function StoreConfigPanel() {
  const { storeId, role } = useAuth();
  const isAdmin = role === 'admin';
  const [config, setConfig] = useState<Config>({ 
    nomeLoja: '', 
    telefone: '', 
    endereco: '', 
    formasPagamento: [], 
    zonasEntrega: [], 
    mensagemBoasVindas: '', 
    linguagemBot: '', 
    idioma: 'pt-AO', 
    tomVoz: 'formal',
    politicaAgendamento: 'opcional',
    slug: '' 
  });
  const [newPayment, setNewPayment] = useState({ tipo: '', detalhes: '' });
  const [newZone, setNewZone] = useState({ zona: '', taxa: '' });
  const [botActive, setBotActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    if (!storeId) { setLoading(false); return; }
    
    const [{ data: loja }, { data: p }, { data: z }] = await Promise.all([
      (supabase as any).from('lojas').select('*').eq('id', storeId).maybeSingle(),
      (supabase as any).from('formas_pagamento').select('*').eq('loja_id', storeId).order('criado_em'),
      (supabase as any).from('taxas_entrega').select('*').eq('loja_id', storeId).order('criado_em'),
    ]);

    if (loja) {
      setBotActive(loja.bot_ativo !== false);
      setConfig({ 
        nomeLoja: loja.nome || '', 
        telefone: loja.telefone || '', 
        endereco: loja.endereco || '', 
        mensagemBoasVindas: loja.mensagem_boas_vindas || '', 
        linguagemBot: loja.linguagem_bot || '', 
        zonasEntrega: z || [], 
        formasPagamento: p || [], 
        idioma: loja.idioma || 'pt-AO',
        tomVoz: loja.tom_voz || 'formal',
        politicaAgendamento: loja.politica_agendamento || 'opcional',
        slug: loja.slug || ''
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
  }, [storeId]);

  const toggleBot = async () => {
    if (!storeId) return;
    const val = !botActive; setBotActive(val);
    const { error } = await (supabase as any).from('lojas').update({ bot_ativo: val }).eq('id', storeId);
    if (error) { toast.error('Erro'); setBotActive(!val); } else toast.success(val ? 'Bot activado!' : 'Bot desactivado!');
  };

  const save = async () => {
    if (!storeId) return;
    try {
      // 1. Update basic store info
      await (supabase as any).from('lojas').update({
        nome: config.nomeLoja, 
        telefone: config.telefone, 
        endereco: config.endereco,
        mensagem_boas_vindas: config.mensagemBoasVindas, 
        linguagem_bot: config.linguagemBot,
        idioma: config.idioma,
        tom_voz: config.tomVoz,
        politica_agendamento: config.politicaAgendamento,
        slug: config.slug,
      }).eq('id', storeId);

      // 2. Sync payment methods (simple delete and insert for efficiency)
      await (supabase as any).from('formas_pagamento').delete().eq('loja_id', storeId);
      if (config.formasPagamento.length > 0) {
        await (supabase as any).from('formas_pagamento').insert(
          config.formasPagamento.map(p => ({ loja_id: storeId, tipo: p.tipo, detalhes: p.detalhes, is_active: p.is_active }))
        );
      }

      // 3. Sync delivery zones
      await (supabase as any).from('taxas_entrega').delete().eq('loja_id', storeId);
      if (config.zonasEntrega.length > 0) {
        await (supabase as any).from('taxas_entrega').insert(
          config.zonasEntrega.map(z => ({ loja_id: storeId, zona: z.zona, taxa: z.taxa, is_active: z.is_active }))
        );
      }

      toast.success('Configurações salvas!');
      fetchConfig();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3 border-2 border-primary/10">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Identidade da Loja</h3>
          </div>
          <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Nome da Loja</label><Input value={config.nomeLoja} onChange={e => setConfig(p => ({ ...p, nomeLoja: e.target.value }))} /></div>

          <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Telefone de Contato</label><Input value={config.telefone} onChange={e => setConfig(p => ({ ...p, telefone: e.target.value }))} /></div>
          <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Endereço Físico</label><Input value={config.endereco} onChange={e => setConfig(p => ({ ...p, endereco: e.target.value }))} /></div>
        </motion.div>
      )}








      <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-glow">
        Salvar Configurações
      </motion.button>
    </div>
  );
}
