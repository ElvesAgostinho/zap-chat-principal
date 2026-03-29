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
          <div>
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Link da Loja (Slug Personalizado)</label>
            <div className="flex items-center gap-2">
              <div className="bg-secondary px-3 py-2 rounded-lg text-xs font-mono text-muted-foreground shrink-0 border border-border/50">/loja/</div>
              <Input 
                value={config.slug} 
                onChange={e => setConfig(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} 
                placeholder="ex: minha-marca"
              />
            </div>
            <div className="flex items-center justify-between mt-2 ml-1 bg-secondary/80 px-3 py-2 rounded-lg border border-border shadow-sm">
              <p className="text-[11px] text-muted-foreground font-medium truncate flex-1">
                Link Público: <span className="text-foreground ml-1">{window.location.host}/loja/{config.slug || '...'}</span>
              </p>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/loja/${config.slug || '...'}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link do catálogo copiado! ✅');
                }}
                className="ml-3 p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-all flex items-center justify-center shrink-0 border border-primary/20"
                title="Copiar Link"
                type="button"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" /> Copiar
              </button>
            </div>
          </div>
          <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Telefone de Contato</label><Input value={config.telefone} onChange={e => setConfig(p => ({ ...p, telefone: e.target.value }))} /></div>
          <div><label className="text-[11px] uppercase tracking-wide text-muted-foreground">Endereço Físico</label><Input value={config.endereco} onChange={e => setConfig(p => ({ ...p, endereco: e.target.value }))} /></div>
        </motion.div>
      )}


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

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3 border border-border/50">
        <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Pagamentos</h3></div>
        
        <div className="space-y-2">
          {config.formasPagamento.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{p.tipo}</p>
                <p className="text-[11px] text-muted-foreground truncate">{p.detalhes || 'Nenhum detalhe'}</p>
              </div>
              <button 
                onClick={() => setConfig(c => ({ ...c, formasPagamento: c.formasPagamento.filter((_, idx) => idx !== i) }))} 
                className="ml-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Remover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 bg-secondary/30 rounded-2xl space-y-3 border border-dashed border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Adicionar Nova Forma</p>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              value={newPayment.tipo} 
              onChange={e => setNewPayment(p => ({ ...p, tipo: e.target.value }))} 
              placeholder="Ex: IBAN" 
              className="text-xs h-9" 
            />
            <Input 
              value={newPayment.detalhes} 
              onChange={e => setNewPayment(p => ({ ...p, detalhes: e.target.value }))} 
              placeholder="Ex: AO06 0055..." 
              className="text-xs h-9" 
            />
          </div>
          <button 
            onClick={() => {
              if (newPayment.tipo.trim()) {
                setConfig(c => ({ ...c, formasPagamento: [...c.formasPagamento, { tipo: newPayment.tipo.trim(), detalhes: newPayment.detalhes.trim(), is_active: true }] }));
                setNewPayment({ tipo: '', detalhes: '' });
              }
            }} 
            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Pagamento
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-5 rounded-2xl shadow-card space-y-3 border border-border/50">
        <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /><h3 className="font-semibold text-foreground">Zonas de Entrega</h3></div>
        
        <div className="space-y-2">
          {config.zonasEntrega.map((z, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{z.zona}</p>
                <p className="text-[11px] text-primary">{z.taxa ? `${z.taxa.toLocaleString()} Kz` : 'Entrega Grátis'}</p>
              </div>
              <button 
                onClick={() => setConfig(c => ({ ...c, zonasEntrega: c.zonasEntrega.filter((_, idx) => idx !== i) }))} 
                className="ml-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                title="Remover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 bg-secondary/30 rounded-2xl space-y-3 border border-dashed border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Adicionar Nova Zona</p>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              value={newZone.zona} 
              onChange={e => setNewZone(p => ({ ...p, zona: e.target.value }))} 
              placeholder="Ex: Talatona" 
              className="text-xs h-9" 
            />
            <Input 
              type="number"
              value={newZone.taxa} 
              onChange={e => setNewZone(p => ({ ...p, taxa: e.target.value }))} 
              placeholder="Taxa (Kz)" 
              className="text-xs h-9" 
            />
          </div>
          <button 
            onClick={() => {
              if (newZone.zona.trim()) {
                setConfig(c => ({ ...c, zonasEntrega: [...c.zonasEntrega, { zona: newZone.zona.trim(), taxa: Number(newZone.taxa) || 0, is_active: true }] }));
                setNewZone({ zona: '', taxa: '' });
              }
            }} 
            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Zona
          </button>
        </div>
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
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Mensagem de boas-vindas</label>
          <Textarea 
            value={config.mensagemBoasVindas} 
            onChange={e => setConfig(p => ({ ...p, mensagemBoasVindas: e.target.value }))} 
            className="text-sm" 
            placeholder="Olá! Use {{link_loja}} para enviar seu catálogo automaticamente."
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">O que o Bot deve dizer (Instruções)</label>
          <Textarea 
            value={config.linguagemBot} 
            onChange={e => setConfig(p => ({ ...p, linguagemBot: e.target.value }))} 
            className="text-sm h-24" 
            placeholder="Ex: Seja amigável e sempre ofereça nosso catálogo {{link_loja}} se o cliente quiser ver produtos."
          />
        </div>
        <div className="space-y-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personalidade e Agendamento</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Tom de Voz</label>
              <div className="flex bg-secondary p-1 rounded-xl">
                <button 
                  onClick={() => setConfig(p => ({ ...p, tomVoz: 'formal' }))} 
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${config.tomVoz === 'formal' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  Formal (PT-PT)
                </button>
                <button 
                  onClick={() => setConfig(p => ({ ...p, tomVoz: 'descontraído' }))} 
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${config.tomVoz === 'descontraído' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  Descontraído
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase">Regras de Agendamento</label>
              <select 
                value={config.politicaAgendamento} 
                onChange={e => setConfig(p => ({ ...p, politicaAgendamento: e.target.value }))}
                className="w-full bg-secondary border-none rounded-xl p-2 text-[11px] font-semibold text-foreground outline-none focus:ring-1 ring-primary/30"
              >
                <option value="false">Desactivado (Não oferece horários)</option>
                <option value="opcional">Opcional (Apenas se o cliente pedir)</option>
                <option value="obrigatorio">Obrigatório (Oferece horários proativamente)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
          <p className="text-[10px] font-bold text-primary uppercase mb-1">Dica de Automação</p>
          <p className="text-xs text-muted-foreground italic">
            O código <span className="font-mono font-bold text-foreground">{"{{link_loja}}"}</span> será substituído pelo seu link público: <br/>
            <span className="text-primary underline text-[10px]">{window.location.origin}/catalogo/{config.slug || 'sua-loja'}</span>
          </p>
        </div>
      </motion.div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="w-full px-4 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-glow">
        Salvar Configurações
      </motion.button>
    </div>
  );
}
