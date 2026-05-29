import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import ChatListPane from '@/components/chat/ChatListPane';
import ChatWorkspace from '@/components/chat/ChatWorkspace';

interface MsgRow { lead_id: string | null; lead_nome: string | null; conteudo: string; tipo: string; created_at: string; is_bot: boolean; respondido_por_nome: string | null; }
interface LeadRow { id: string; nome: string; telefone: string; controle_conversa: string; precisa_humano: boolean; atendente_id?: string | null; foto_url?: string | null; }
interface Agent { id: string; nome: string; }

export default function LiveChat({ initialLeads, initialAgents, messages = [] }: { initialLeads: LeadRow[], initialAgents: Agent[], messages?: MsgRow[] }) {
  const { storeId } = useAuth();
  const [search, setSearch] = useState(() => sessionStorage.getItem('chat_search') || '');
  const [filter, setFilter] = useState<'all' | 'unread' | 'bot' | 'human'>(() => (sessionStorage.getItem('chat_filter') as any) || 'all');
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);
  const [agents] = useState<Agent[]>(initialAgents);
  const [syncing, setSyncing] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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
    if (/^[\d\s\-+()]+$/.test(clean)) return false;
    if (clean.toLowerCase() === 'lead' || clean.toLowerCase() === 'novo lead') return false;
    return true;
  };

  const conversations = useMemo(() => {
    const grouped = new Map<string, MsgRow[]>();
    messages.forEach(msg => { if (!msg.lead_id) return; const existing = grouped.get(msg.lead_id) || []; existing.push(msg); grouped.set(msg.lead_id, existing); });
    
    // Add leads with no messages yet
    leads.forEach(lead => {
      if (!grouped.has(lead.id)) {
        grouped.set(lead.id, [{
          lead_id: lead.id,
          lead_nome: lead.nome,
          conteudo: '',
          tipo: 'recebida',
          created_at: new Date().toISOString(),
          is_bot: true,
          respondido_por_nome: null
        }]);
      }
    });

    return Array.from(grouped.entries()).map(([leadId, msgs]) => {
      const sorted = [...msgs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const last = sorted[0];
      const lead = leads.find(l => l.id === leadId);
      
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
        unreadCount: sorted.filter(m => m.tipo === 'recebida' && lead?.precisa_humano).length, // simplified unread logic
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

  const handleSyncProfiles = async () => {
    if (!storeId) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: { action: 'sync_all_profiles', store_id: storeId }
      });
      if (data?.success === false || data?.ok === false) throw new Error(data.error || 'Erro na sincronização');
      toast.success(data?.message || `Fotos sincronizadas com sucesso!`);
      const { data: nextLeads } = await supabase.from('leads').select('id, nome, telefone, controle_conversa, precisa_humano, foto_url, atendente_id').eq('loja_id', storeId);
      if (nextLeads) setLeads(nextLeads as any);
    } catch (err: any) {
      toast.error('Erro ao sincronizar fotos.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncNames = async () => {
    if (!storeId) return;
    setSyncing(true);
    try {
      const { data: storeData } = await supabase.from('lojas').select('instance_name').eq('id', storeId).maybeSingle();
      if (!storeData?.instance_name) {
        toast.error('Instância não configurada.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
        body: { action: 'sync_names', instance: storeData.instance_name, store_id: storeId }
      });
      if (data?.success === false || data?.ok === false) throw new Error(data.error || 'Erro na sincronização de nomes');
      toast.success(`Nomes sincronizados`);
      const { data: nextLeads } = await supabase.from('leads').select('id, nome, telefone, controle_conversa, precisa_humano, foto_url, atendente_id').eq('loja_id', storeId);
      if (nextLeads) setLeads(nextLeads as any);
    } catch (err: any) {
      toast.error('Erro ao sincronizar nomes.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAssignAgent = async (leadId: string, agentId: string) => {
    const { error } = await supabase
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
    <div className="flex w-full h-full bg-white overflow-hidden shadow-sm border border-slate-200/60 rounded-3xl">
      <ChatListPane 
        conversations={filtered}
        selectedLeadId={selectedLeadId}
        onSelectLead={setSelectedLeadId}
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        syncing={syncing}
        onSyncPhotos={handleSyncProfiles}
        onSyncNames={handleSyncNames}
        agents={agents}
        onAssignAgent={handleAssignAgent}
      />
      
      <div className="flex-1 h-full bg-[hsl(var(--whatsapp-bg))] relative flex">
        {selectedLeadId ? (
          <ChatWorkspace leadId={selectedLeadId} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 select-none">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="text-sm font-bold uppercase tracking-widest">Seleccione uma conversa</p>
          </div>
        )}
      </div>
    </div>
  );
}
