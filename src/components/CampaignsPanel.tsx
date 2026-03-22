import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, Image, CheckCircle2, Clock, Megaphone, Loader2, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Produto } from '@/types';
import { formatCurrency } from '@/data/mock';

interface CampaignsPanelProps {
  storeId: string | null;
  products: Produto[];
}

interface LeadRecipient {
  id: string;
  nome: string | null;
  telefone: string | null;
  tags: string[] | null;
  status: string;
}

interface CampaignRecord {
  id: string;
  produto_nome: string | null;
  conteudo: string | null;
  destinatarios: number;
  enviados: number;
  status_publicado: boolean;
  data_envio: string;
}

export default function CampaignsPanel({ storeId, products }: CampaignsPanelProps) {
  const [allRecipients, setAllRecipients] = useState<LeadRecipient[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<'todos' | 'leads' | 'clientes'>('todos');
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [message, setMessage] = useState('');
  const [publishStatus, setPublishStatus] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sentCampaigns, setSentCampaigns] = useState<CampaignRecord[]>([]);

  useEffect(() => {
    if (!storeId) return;
    const fetchData = async () => {
      const [leadRes, lojaRes, campRes] = await Promise.all([
        (supabase as any).from('leads').select('id, nome, telefone, tags, status').eq('loja_id', storeId),
        (supabase as any).from('lojas').select('instance_name').eq('id', storeId).maybeSingle(),
        (supabase as any).from('campanhas').select('id, produto_nome, conteudo, destinatarios, enviados, status_publicado, data_envio').eq('loja_id', storeId).order('data_envio', { ascending: false }).limit(20),
      ]);
      if (leadRes.data) setAllRecipients(leadRes.data);
      if (lojaRes.data) setInstanceName(lojaRes.data.instance_name);
      if (campRes.data) setSentCampaigns(campRes.data);
    };
    fetchData();
  }, [storeId]);

  const recipients = allRecipients.filter(r => {
    if (audienceFilter === 'leads') return r.status !== 'cliente' && r.status !== 'comprado';
    if (audienceFilter === 'clientes') return r.status === 'cliente' || r.status === 'comprado';
    return true;
  });

  const toggleRecipient = (id: string) => setSelectedRecipients(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const handleSelectAll = () => { if (selectAll) setSelectedRecipients([]); else setSelectedRecipients(recipients.map(r => r.id)); setSelectAll(!selectAll); };

  const product = products.find(p => p.id === selectedProduct);
  const hasRecipients = selectedRecipients.length > 0;
  const canSend = !!selectedProduct && (hasRecipients || publishStatus);

  const buttonLabel = (() => {
    if (sending) return 'Enviando...';
    if (!selectedProduct) return 'Selecione um produto';
    const parts: string[] = [];
    if (hasRecipients) parts.push(`Enviar para ${selectedRecipients.length} lead(s)`);
    if (publishStatus) parts.push('Publicar no Status');
    return parts.join(' + ') || 'Selecione uma ação';
  })();

  const handleSend = async () => {
    if (!selectedProduct || (!hasRecipients && !publishStatus) || !instanceName) {
      toast.error(!instanceName ? 'Nenhuma instância WhatsApp conectada.' : 'Selecione produto e destinatários.');
      return;
    }
    const campaignMsg = product ? `${message ? message + '\n\n' : ''}🛍️ ${product.nome} - ${formatCurrency(product.preco)}` : message;
    const selected = recipients.filter(r => selectedRecipients.includes(r.id));
    setSending(true);
    const totalOps = selected.length + (publishStatus ? 1 : 0);
    setSendProgress({ current: 0, total: totalOps });
    let successCount = 0;

    for (let i = 0; i < selected.length; i++) {
      const r = selected[i];
      if (!r.telefone) { setSendProgress({ current: i + 1, total: totalOps }); continue; }
      try {
        const { error } = await supabase.functions.invoke('send-whatsapp', { body: { instance: instanceName, number: r.telefone, text: campaignMsg } });
        if (!error) successCount++;
      } catch {}
      setSendProgress({ current: i + 1, total: totalOps });
    }

    if (publishStatus && product) {
      try {
        const body: Record<string, unknown> = { instance: instanceName, statusPost: true };
        if (product.imagem) { body.mediaUrl = product.imagem; body.mediaType = 'image'; body.caption = campaignMsg; }
        else { body.text = campaignMsg; }
        await supabase.functions.invoke('send-whatsapp', { body });
      } catch {}
      setSendProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    if (storeId) {
      const { data: saved } = await (supabase as any).from('campanhas').insert({
        loja_id: storeId, produto_nome: product?.nome || null, conteudo: campaignMsg,
        destinatarios: selected.length, enviados: successCount, status_publicado: publishStatus,
      }).select('id, produto_nome, conteudo, destinatarios, enviados, status_publicado, data_envio').single();
      if (saved) setSentCampaigns(prev => [saved, ...prev]);
    }

    toast.success(`Enviado: ${successCount}/${selected.length} lead(s)${publishStatus ? ' + Status' : ''}!`);
    setSelectedRecipients([]); setSelectedProduct(''); setMessage(''); setPublishStatus(false); setSelectAll(false); setSending(false); setSendProgress({ current: 0, total: 0 });
  };

  if (!storeId) return <p className="text-sm text-muted-foreground text-center py-8">Loja não configurada.</p>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-card rounded-3xl p-6 shadow-card border border-border/40 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"><Megaphone className="w-5 h-5 text-primary" /></div>
          <div><h3 className="text-sm font-bold text-foreground">Disparo em Massa</h3><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Crie e envie promoções instantâneas</p></div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block"><Package className="w-3.5 h-3.5 inline mr-1" />Selecione o produto ({products.length})</label>
          {products.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 bg-secondary rounded-xl">Nenhum produto cadastrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {products.map(p => (
                <button key={p.id} onClick={() => setSelectedProduct(p.id)} disabled={sending}
                  className={`flex items-center gap-2.5 p-2 rounded-xl transition-all text-left ${selectedProduct === p.id ? 'bg-primary/10 ring-2 ring-primary shadow-sm' : 'bg-secondary hover:bg-secondary/80'}`}>
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {p.imagem ? <img src={p.imagem} alt={p.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground truncate">{p.nome}</p>
                    <p className="text-[11px] text-primary font-semibold">{formatCurrency(p.preco)}</p>
                    <span className="text-[10px] text-muted-foreground">{p.estoque} em estoque</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Mensagem adicional (opcional)</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Ex: 🔥 Super promoção!" rows={3} className="w-full px-4 py-3 rounded-xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none text-sm" disabled={sending} />
        </div>

        <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-secondary">
          <div className="flex items-center gap-2"><Image className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-foreground">Publicar no Status</span></div>
          <Switch checked={publishStatus} onCheckedChange={setPublishStatus} disabled={sending} />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-2 block">🎯 Audiência</label>
          <div className="flex gap-2 mb-3">
            {(['todos', 'leads', 'clientes'] as const).map(f => (
              <button key={f} onClick={() => { setAudienceFilter(f); setSelectedRecipients([]); setSelectAll(false); }}
                className={`flex-1 text-xs font-medium py-2 rounded-xl transition-all capitalize ${audienceFilter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                {f === 'todos' ? 'Todos' : f === 'leads' ? 'Apenas Leads' : 'Apenas Clientes'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground"><Users className="w-3.5 h-3.5 inline mr-1" />Destinatários ({selectedRecipients.length}/{recipients.length})</label>
            <button onClick={handleSelectAll} disabled={sending} className="text-xs font-medium text-primary hover:underline">{selectAll ? 'Desmarcar todos' : 'Selecionar todos'}</button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {recipients.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum lead encontrado.</p>}
            {recipients.map(r => (
              <button key={r.id} onClick={() => toggleRecipient(r.id)} disabled={sending}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${selectedRecipients.includes(r.id) ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-secondary'}`}>
                <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center ${selectedRecipients.includes(r.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                  {selectedRecipients.includes(r.id) && <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{r.nome || 'Sem nome'}</p>
                  <p className="text-[10px] text-muted-foreground">{r.telefone || 'Sem número'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {sending && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" />Enviando {sendProgress.current}/{sendProgress.total}...</div>
            <Progress value={(sendProgress.current / sendProgress.total) * 100} className="h-2" />
          </div>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={!canSend || sending} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{buttonLabel}
        </motion.button>
      </div>

      {sentCampaigns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-metadata">Campanhas enviadas</h3>
          {sentCampaigns.map(c => (
            <div key={c.id} className="bg-card rounded-2xl p-3.5 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /><span className="text-xs font-medium text-foreground">{c.enviados}/{c.destinatarios} enviado(s)</span></div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="w-3 h-3" />{new Date(c.data_envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              {c.produto_nome && <p className="text-xs font-medium text-foreground mb-0.5">{c.produto_nome}</p>}
              <p className="text-xs text-muted-foreground line-clamp-2">{c.conteudo}</p>
              {c.status_publicado && <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full"><Image className="w-3 h-3" /> Status publicado</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
