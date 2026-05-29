import React from 'react';
import { Search, Image as ImageIcon, User } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface Conversation {
  leadId: string;
  leadName: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  lastDirection: string;
  isBot: boolean;
  lastResponderName: string | null;
  unreadCount: number;
  atendenteId?: string | null;
  fotoUrl?: string | null;
}

interface ChatListPaneProps {
  conversations: Conversation[];
  selectedLeadId: string | null;
  onSelectLead: (id: string) => void;
  search: string;
  setSearch: (s: string) => void;
  filter: 'all' | 'unread' | 'bot' | 'human';
  setFilter: (f: 'all' | 'unread' | 'bot' | 'human') => void;
  syncing: boolean;
  onSyncPhotos: () => void;
  onSyncNames: () => void;
  agents: {id: string; nome: string}[];
  onAssignAgent: (leadId: string, agentId: string) => void;
}

export default function ChatListPane({
  conversations, selectedLeadId, onSelectLead, search, setSearch, filter, setFilter,
  syncing, onSyncPhotos, onSyncNames, agents, onAssignAgent
}: ChatListPaneProps) {

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const filters = [
    { id: 'all' as const, label: 'TODAS' },
    { id: 'unread' as const, label: 'NÃO LIDAS' },
    { id: 'bot' as const, label: 'BOT' },
    { id: 'human' as const, label: 'HUMANO' }
  ];

  return (
    <div className="w-[400px] flex-shrink-0 bg-white border-r border-slate-100 flex flex-col h-full overflow-hidden">
      {/* Header section */}
      <div className="px-4 py-4 border-b border-slate-100 flex flex-col gap-4 flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 hover:border-sky-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 transition-all shadow-sm">
            <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar conversa..."
              className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-700 w-full placeholder:text-slate-400"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
            {filters.map(f => (
              <button 
                key={f.id} 
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider transition-all whitespace-nowrap
                  ${filter === f.id 
                    ? 'bg-[#0ea5e9] text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 pl-2 flex-shrink-0">
            <button 
              onClick={onSyncPhotos} disabled={syncing}
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-600 hover:text-sky-600 transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              FOTOS
            </button>
            <button 
              onClick={onSyncNames} disabled={syncing}
              className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-600 hover:text-sky-600 transition-colors disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
              NOMES
            </button>
          </div>
        </div>
      </div>

      {/* List section */}
      <div className="flex-1 overflow-y-auto bg-white relative">
        {conversations.map(conv => {
          const isSelected = selectedLeadId === conv.leadId;
          return (
            <button
              key={conv.leadId}
              onClick={() => onSelectLead(conv.leadId)}
              className={`w-full text-left flex items-start gap-3 px-4 py-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group relative
                ${isSelected ? 'bg-sky-50/50' : 'bg-white'}`}
            >
              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0ea5e9]" />}
              
              <div className="relative flex-shrink-0 mt-1">
                <div className="w-[46px] h-[46px] rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {conv.fotoUrl ? (
                    <img src={conv.fotoUrl} alt={conv.leadName} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = ''; (e.target as any).style.display = 'none'; }} />
                  ) : (
                    <User className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full bg-[#0ea5e9] text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white shadow-sm z-10">
                    {conv.unreadCount}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <h3 className="font-bold text-[14px] text-slate-900 truncate">
                    {conv.leadName}
                  </h3>
                  <time className="text-[11px] text-slate-400 font-medium tabular-nums flex-shrink-0 mt-0.5">
                    {formatTime(conv.lastMessageTime)}
                  </time>
                </div>
                
                {conv.phone && (
                  <p className="text-[11px] text-slate-500 font-bold tracking-wider mb-1">
                    {conv.phone}
                  </p>
                )}

                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <p className="text-[13px] text-slate-500 truncate leading-tight">
                    {conv.lastDirection === 'enviada' ? <span className="font-semibold">Você: </span> : ''}
                    {conv.lastMessage.startsWith('[') ? conv.lastMessage : conv.lastMessage}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between h-full py-0.5 pl-2 gap-3">
                <div onClick={e => e.stopPropagation()}>
                  <select 
                    value={conv.atendenteId || 'none'}
                    onChange={(e) => onAssignAgent(conv.leadId, e.target.value)}
                    className="bg-slate-100 text-slate-600 text-[10px] font-bold py-1 px-2 rounded-lg border-none outline-none hover:bg-slate-200 cursor-pointer w-[72px]"
                  >
                    <option value="none">Livre</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <div className="text-slate-300 group-hover:text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </div>
              </div>
            </button>
          );
        })}
        
        {conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-sm font-medium">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
