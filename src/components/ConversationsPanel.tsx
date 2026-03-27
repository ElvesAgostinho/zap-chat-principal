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



  const isHumanName = (name: string | null) => {
    if (!name) return false;
    const clean = name.trim();
    if (clean.length < 2) return false;
    // Se contém apenas números e símbolos de telefone, não é "humano" no contexto de nome
    if (/^[\d\s\-+()]+$/.test(clean)) return false;
    // Se for genericamente "Lead", também não é o ideal se tivermos outro
    if (clean.toLowerCase() === 'lead' || clean.toLowerCase() === 'novo lead') return false;
    return true;
  };

  const conversations = useMemo<Conversation[]>(() => {
    const grouped = new Map<string, MsgRow[]>();
    messages.forEach(msg => { if (!msg.lead_id) return; const existing = grouped.get(msg.lead_id) || []; existing.push(msg); grouped.set(msg.lead_id, existing); });
    return Array.from(grouped.entries()).map(([leadId, msgs]) => {
      const sorted = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const last = sorted[0];
      const lead = leads.find(l => l.id === leadId);
      
      // Prioridade: 1. Nome do Lead (tabela Leads) se for humano, 2. Nome da Mensagem se for humano, 3. Nome do Lead, 4. Fallback
      let displayName = `Lead #${leadId.slice(0, 6)}`;
      if (isHumanName(lead?.nome)) displayName = lead!.nome;
      else if (isHumanName(last.lead_nome)) displayName = last.lead_nome!;
      else if (lead?.nome) displayName = lead.nome;
      else if (last.lead_nome) displayName = last.lead_nome;

      return { 
        leadId, 
        leadName: displayName, 
        phone: lead?.telefone || '', 
        lastMessage: last.conteudo, 
        lastMessageTime: last.created_at, 
        lastDirection: last.tipo, 
        isBot: last.is_bot || false, 
        lastResponderName: last.respondido_por_nome || null, 
        unreadCount: sorted.filter(m => m.tipo === 'recebida').length, 
        controleConversa: lead?.controle_conversa || 'bot', 
        precisaHumano: lead?.precisa_humano || false, 
        atendenteId: lead?.atendente_id, 
        fotoUrl: lead?.foto_url 
      };
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
        <div className="flex-1 flex items-center px-4 bg-card/40 backdrop-blur-md rounded-2xl border border-white/5 focus-within:border-primary/40 transition-all hover:bg-card/60 shadow-inner group">
          <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conversa..."
            className="w-full bg-transparent py-3 px-3 text-[13px] font-medium text-foreground placeholder:text-muted-foreground outline-none border-none" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0 items-center">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border
                ${filter === f.id ? 'bg-primary text-black border-primary shadow-glow' : 'bg-card/40 backdrop-blur-sm text-muted-foreground border-white/5 hover:bg-white/10 hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex gap-2">
            <button 
              onClick={handleSyncProfiles}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              title="Sincronizar fotos do WhatsApp"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <ImageIcon className="w-4 h-4 text-primary" />}
              <span className="hidden sm:inline">Fotos</span>
            </button>
            <button 
              onClick={handleSyncNames}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider bg-white/5 text-foreground border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
              title="Sincronizar nomes do WhatsApp"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <User className="w-4 h-4 text-primary" />}
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
                  className="flex-1 bg-card/40 backdrop-blur-md rounded-3xl px-5 py-4 border border-white/5 flex items-center gap-4 text-left hover:bg-white/[0.05] transition-all hover:border-primary/20 hover:shadow-glow group/card"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover/card:border-primary/30 transition-colors">
                      {conv.fotoUrl ? (
                        <img src={conv.fotoUrl} alt={conv.leadName} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = ''; (e.target as any).style.display = 'none'; }} />
                      ) : null}
                      <span className="text-muted-foreground font-bold text-xs font-display">{conv.leadName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                    </div>
                    {conv.unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-primary text-black text-[10px] font-black flex items-center justify-center px-1 border-2 border-slate-950 shadow-glow animate-bounce-subtle">{conv.unreadCount}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-base text-foreground truncate font-display tracking-tight">{conv.leadName}</h3>
                      <time className="text-[10px] text-muted-foreground font-bold tabular-nums opacity-60">{formatTime(conv.lastMessageTime)}</time>
                    </div>
                    {conv.phone && (
                      <p className="text-[10px] text-muted-foreground/70 font-black tracking-widest uppercase mb-1.5">{conv.phone}</p>
                    )}
                    <div className="flex items-center gap-2 opacity-90">
                      {conv.precisaHumano ? <span className="relative flex h-2.5 w-2.5 flex-shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /></span>
                      : conv.isBot ? <Bot className="w-4 h-4 text-primary flex-shrink-0 opacity-80" /> : <User className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-60" />}
                      <p className="text-[13px] leading-tight text-muted-foreground/80 truncate font-medium">
                        {conv.lastDirection === 'enviada' ? (conv.lastResponderName ? <span className="font-bold text-primary/80">{conv.lastResponderName}: </span> : <span className="font-bold text-primary/80">Você: </span>) : ''}
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.atendenteId && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />
                        <span className="text-[9px] font-black text-primary/80 uppercase tracking-[0.2em]">Atendente: {agents.find(a => a.id === conv.atendenteId)?.nome}</span>
                      </div>
                    )}
                  </div>
                </button>
                <div className="flex flex-col items-center gap-2 pr-2">
                  <select 
                    value={conv.atendenteId || 'none'}
                    onChange={(e) => handleAssignAgent(conv.leadId, e.target.value)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-primary/30 max-w-[80px] transition-colors
                      ${!conv.atendenteId ? 'status-badge-livre' : 'bg-card border-border text-foreground'}`}
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
