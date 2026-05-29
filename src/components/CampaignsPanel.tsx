import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, CheckCircle2, Clock, Megaphone, Loader2, Tag as TagIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface CampaignsPanelProps {
  storeId: string | null;
  products: any[]; // Keep prop signature so Index doesn't break
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
  conteudo: string | null;
  destinatarios: number;
  enviados: number;
  data_envio: string;
}

export default function CampaignsPanel({ storeId }: CampaignsPanelProps) {
  const [allRecipients, setAllRecipients] = useState<LeadRecipient[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [instanceName, setInstanceName] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sentCampaigns, setSentCampaigns] = useState<CampaignRecord[]>([]);

  useEffect(() => {
    if (!storeId) return;
    const fetchData = async () => {
      const [leadRes, lojaRes, campRes] = await Promise.all([
        supabase.from('leads').select('id, nome, telefone, tags, status').eq('loja_id', storeId),
        supabase.from('lojas').select('instance_name').eq('id', storeId).maybeSingle(),
        supabase.from('campanhas').select('id, conteudo, destinatarios, enviados, data_envio').eq('loja_id', storeId).order('data_envio', { ascending: false }).limit(20),
      ]);
      
      if (leadRes.data) {
        setAllRecipients(leadRes.data);
        // Extract unique tags
        const tags = new Set<string>();
        leadRes.data.forEach(l => {
          if (l.tags) l.tags.forEach(t => tags.add(t));
        });
        setAvailableTags(Array.from(tags));
      }
      if (lojaRes.data) setInstanceName(lojaRes.data.instance_name);
      if (campRes.data) setSentCampaigns(campRes.data);
    };
    fetchData();
  }, [storeId]);

  const recipients = allRecipients.filter(r => {
    if (!selectedTag) return true; // Send to all
    return r.tags && r.tags.includes(selectedTag);
  });

  const canSend = message.trim().length > 0 && recipients.length > 0;

  const handleSend = async () => {
    if (!message || recipients.length === 0 || !instanceName) {
      toast.error(!instanceName ? 'Nenhuma instância WhatsApp conectada.' : 'Escreve uma mensagem e selecciona destinatários.');
      return;
    }
    
    const confirm = window.confirm(`Vais enviar uma mensagem para ${recipients.length} contactos. Desejas continuar?`);
    if (!confirm) return;

    setSending(true);
    const totalOps = recipients.length;
    setSendProgress({ current: 0, total: totalOps });
    let successCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.telefone) { setSendProgress({ current: i + 1, total: totalOps }); continue; }
      try {
        const { data, error } = await supabase.functions.invoke('send-whatsapp', { body: { instance: instanceName, number: r.telefone, text: message } });
        if (!error && data?.success !== false) successCount++;
      } catch (err) {
        console.error(`[Broadcasts] Invoke error for ${r.telefone}:`, err);
      }
      setSendProgress({ current: i + 1, total: totalOps });
    }

    if (storeId) {
      const { data: saved } = await supabase.from('campanhas').insert({
        loja_id: storeId, 
        conteudo: message,
        destinatarios: recipients.length, 
        enviados: successCount, 
        status_publicado: false,
      }).select('id, conteudo, destinatarios, enviados, data_envio').single();
      if (saved) setSentCampaigns(prev => [saved, ...prev]);
    }

    toast.success(`Broadcast enviado para ${successCount}/${recipients.length} contactos!`);
    setMessage('');
    setSending(false); 
    setSendProgress({ current: 0, total: 0 });
  };

  if (!storeId) return <p className="text-sm text-slate-500 text-center py-8">Loja não configurada.</p>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-sky-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Nova Transmissão (Broadcast)</h3>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Envio em Massa por Etiquetas</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
            <TagIcon className="w-4 h-4 text-slate-400" />
            Filtro de Audiência (Etiqueta)
          </label>
          <select 
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            disabled={sending}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 font-medium"
          >
            <option value="">Todas as pessoas ({allRecipients.length} contactos)</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>
                Tag: {tag} ({allRecipients.filter(r => r.tags?.includes(tag)).length} contactos)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">Mensagem a Enviar</label>
          <textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Olá {{nome}}, temos uma novidade para si..." 
            rows={5} 
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none text-sm" 
            disabled={sending} 
          />
        </div>

        {sending && (
          <div className="space-y-2 bg-sky-50 p-4 rounded-xl border border-sky-100">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              A enviar para {sendProgress.current} de {sendProgress.total} contactos...
            </div>
            <Progress value={(sendProgress.current / sendProgress.total) * 100} className="h-2 bg-sky-200" />
          </div>
        )}

        <motion.button 
          whileTap={{ scale: 0.98 }} 
          onClick={handleSend} 
          disabled={!canSend || sending} 
          className="w-full py-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {sending ? 'A Enviar Broadcast...' : `Enviar agora para ${recipients.length} contactos`}
        </motion.button>
      </div>


    </div>
  );
}
