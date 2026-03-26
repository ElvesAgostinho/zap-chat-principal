import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bot, User, Clock, ChevronRight, Loader2, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MsgRow { lead_id: string | null; lead_nome: string | null; conteudo: string; tipo: string; created_at: string; is_bot: boolean; respondido_por_nome: string | null; }
interface LeadRow { id: string; nome: string; telefone: string; controle_conversa: string; precisa_humano: boolean; atendente_id?: string | null; foto_url?: string | null; }
interface Agent { id: string; nome: string; }

interface Conversation {
  leadId: string; leadName: string; phone: string; lastMessage: string; lastMessageTime: string;
  lastDirection: string; isBot: boolean; lastResponderName: string | null; unreadCount: number;
  controleConversa: string; precisaHumano: boolean; atendenteId?: string | null; fotoUrl?: string | null;
}

export default function ConversationsPanel({ initialLeads, initialAgents, messages = [] }: { initialLeads: LeadRow[], initialAgents: Agent[], messages?: MsgRow[] }) {
  const navigate = useNavigate();
  const { storeId } = useAuth();
  const [search, setSearch] = useState(() => sessionStorage.getItem('chat_search') || '');
  const [filter, setFilter] = useState<'all' | 'unread' | 'bot' | 'human'>(() => (sessionStorage.getItem('chat_filter') as any) || 'all');
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
  const [agents] = useState<Agent[]>(initialAgents);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('chat_search', search);
    sessionStorage.setItem('chat_filter', filter);
  }, [search, filter]);

  useEffect(() => {
    if (initialLeads && initialLeads.length > 0) {
      setLeads(initialLeads);
    }
  }, [initialLeads]);



  const conversations = useMemo<Conversation[]>(() => {
    const grouped = new Map<string, MsgRow[]>();
    messages.forEach(msg => { if (!msg.lead_id) return; const existing = grouped.get(msg.lead_id) || []; existing.push(msg); grouped.set(msg.lead_id, existing); });
    return Array.from(grouped.entries()).map(([leadId, msgs]) => {
      const sorted = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const last = sorted[0];
      const lead = leads.find(l => l.id === leadId);
      return { leadId, leadName: last.lead_nome || lead?.nome || `Lead #${leadId.slice(0, 6)}`, phone: lead?.telefone || '', lastMessage: last.conteudo, lastMessageTime: last.created_at, lastDirection: last.tipo, isBot: last.is_bot || false, lastResponderName: last.respondido_por_nome || null, unreadCount: sorted.filter(m => m.tipo === 'recebida').length, controleConversa: lead?.controle_conversa || 'bot', precisaHumano: lead?.precisa_humano || false, atendenteId: lead?.atendente_id, fotoUrl: lead?.foto_url };
    }).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
  }, [messages, leads]);

  const filtered = useMemo(() => {
    let list = conversations;
    if (search) { const q = search.toLowerCase(); list = list.filter(c => c.leadName.toLowerCase().includes(q) || c.phone.includes(q)); }
    if (filter === 'unread') list = list.filter(c => c.unreadCount > 0);
    if (filter === 'bot') list = list.filter(c => c.isBot);
    if (filter === 'human') list = list.filter(c => !c.isBot);
    return list;
  }, [conversations, search, filter]);

  const formatTime = (ts: string) => {
    const d = new Date(ts); const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const filters = [{ id: 'all' as const, label: 'Todas' }, { id: 'unread' as const, label: 'Não lidas' }, { id: 'bot' as const, label: 'Bot' }, { id: 'human' as const, label: 'Humano' }];

  const handleSyncProfiles = async () => {
    if (!storeId) return;
    setSyncing(true);
    try {
      console.log('Invoking sync-all-profiles action...');
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: { action: 'sync_all_profiles', store_id: storeId }
      });
      if (data?.success === false || data?.ok === false) throw new Error(data.error || 'Erro na sincronização');
      
      const count = data?.processed ?? 0;
      toast.success(data?.message || `${count} fotos sincronizadas com sucesso!`);
      // Reload lead data to show new photos
      const { data: nextLeads } = await (supabase as any).from('leads').select('id, nome, telefone, controle_conversa, precisa_humano, foto_url, atendente_id').eq('loja_id', storeId);
      if (nextLeads) setLeads(nextLeads);
    } catch (err: any) {
      console.error('Error syncing profiles:', err);
      toast.error('Erro ao sincronizar fotos.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncNames = async () => {
    if (!storeId) return;
    setSyncing(true);
    try {
      const { data: storeData } = await (supabase as any).from('lojas').select('instance_name').eq('id', storeId).maybeSingle();
      if (!storeData?.instance_name) {
        toast.error('Instância não configurada.');
        return;
      }

      console.log('Invoking sync_names action...');
      const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
        body: { action: 'sync_names', instance: storeData.instance_name, store_id: storeId }
      });
      
      if (data?.success === false || data?.ok === false) throw new Error(data.error || 'Erro na sincronização de nomes');
      
      console.log('[sync_names] Response details:', data);
      const count = data?.updated ?? 0;
      const total = data?.total_contacts ?? 0;
      toast.success(`${count} nomes sincronizados (Total na API: ${total})`);
      
      if (data?.debug_sample) {
        console.table(data.debug_sample);
      }
      
      // Reload lead data to show new names
      const { data: nextLeads } = await (supabase as any).from('leads').select('id, nome, telefone, controle_conversa, precisa_humano, foto_url, atendente_id').eq('loja_id', storeId);
      if (nextLeads) setLeads(nextLeads);
    } catch (err: any) {
      console.error('Error syncing names:', err);
      toast.error('Erro ao sincronizar nomes.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAssignAgent = async (leadId: string, agentId: string) => {
    const { error } = await (supabase as any)
      .from('leads')
      .update({ atendente_id: agentId === 'none' ? null : agentId })
      .eq('id', leadId);

    if (error) toast.error('Erro ao atribuir agente');
    else {
      toast.success('Agente atribuído!');
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, atendente_id: agentId === 'none' ? null : agentId } : l));
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 flex items-center px-3 bg-card rounded-xl border border-border focus-within:border-primary/50 transition-all hover:border-border/80">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..."
            className="w-full bg-transparent py-2.5 px-2 text-[13px] font-medium text-foreground placeholder:text-muted-foreground outline-none border-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0 items-center">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all
                ${filter === f.id ? 'gradient-primary text-white shadow-glow' : 'bg-card text-muted-foreground border border-border hover:bg-muted'}`}>
              {f.label}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex gap-1.5">
            <button 
              onClick={handleSyncProfiles}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-muted text-foreground border border-border hover:bg-accent transition-all disabled:opacity-50"
              title="Sincronizar fotos do WhatsApp"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Fotos</span>
            </button>
            <button 
              onClick={handleSyncNames}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-muted text-foreground border border-border hover:bg-accent transition-all disabled:opacity-50"
              title="Sincronizar nomes do WhatsApp"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Nomes</span>
            </button>
          </div>
        </div>
      </div>
      {!messages && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--whatsapp-mid))]" /></div>}
      {messages && (
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {filtered.map(conv => (
              <motion.div 
                key={conv.leadId} 
                layout 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="group relative flex gap-2"
              >
                <button
                  onClick={() => navigate(`/chat?lead=${conv.leadId}`)}
                  className="flex-1 bg-card rounded-2xl px-4 py-3 shadow-card border border-border/50 flex items-center gap-3 text-left hover:bg-accent/30 transition-all hover:shadow-elevated"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-accent flex items-center justify-center border border-border/50">
                      {conv.fotoUrl ? (
                        <img src={conv.fotoUrl} alt={conv.leadName} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = ''; (e.target as any).style.display = 'none'; }} />
                      ) : null}
                      <span className="text-accent-foreground font-semibold text-sm">{conv.leadName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    </div>
                    {conv.unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[hsl(var(--whatsapp-mid))] text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-card">{conv.unreadCount}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm text-foreground truncate">{conv.leadName}</h3>
                      <time className="text-[10px] text-muted-foreground flex-shrink-0">{formatTime(conv.lastMessageTime)}</time>
                    </div>
                    {conv.phone && (
                      <p className="text-[10px] text-muted-foreground/70 font-medium mb-1">{conv.phone}</p>
                    )}
                    <div className="flex items-center gap-1.5 opacity-90">
                      {conv.precisaHumano ? <span className="relative flex h-2.5 w-2.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--badge-red))] opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(var(--badge-red))]" /></span>
                      : conv.isBot ? <Bot className="w-3.5 h-3.5 text-[hsl(var(--whatsapp-mid))] flex-shrink-0 mb-[1px]" /> : <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mb-[1px]" />}
                      <p className="text-[12px] leading-none text-muted-foreground truncate">{conv.lastDirection === 'enviada' ? (conv.lastResponderName ? <span className="font-semibold text-foreground/70">{conv.lastResponderName}: </span> : <span className="font-semibold text-foreground/70">Você: </span>) : ''}{conv.lastMessage}</p>
                    </div>
                    {conv.atendenteId && (
                      <div className="mt-1 flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-primary" />
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Atribuído a: {agents.find(a => a.id === conv.atendenteId)?.nome}</span>
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex flex-col items-center gap-2 pr-2">
                  <select 
                    value={conv.atendenteId || 'none'}
                    onChange={(e) => handleAssignAgent(conv.leadId, e.target.value)}
                    className="p-1.5 rounded-lg border border-border bg-card text-[10px] focus:outline-none focus:ring-1 focus:ring-primary/30 max-w-[80px]"
                  >
                    <option value="none">Livre</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><MessageSquare className="w-10 h-10 mb-3 opacity-40" /><p className="text-sm font-medium">Nenhuma conversa</p></div>}
        </div>
      )}
    </div>
  );
}
