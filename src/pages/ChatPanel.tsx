import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Bot, User, Loader2, Paperclip, Image, FileText, Mic, X, Camera, UserCheck, RotateCcw, Download, Check, CheckCheck, MessageSquare, Plus, CalendarClock, Info, ChevronLeft, LayoutDashboard, History, Settings } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MsgRow { id: string; lead_id: string | null; lead_nome: string | null; conteudo: string; tipo: string; is_bot: boolean; created_at: string; loja_id: string; respondido_por: string | null; respondido_por_nome: string | null; media_url?: string | null; media_type?: string | null; }

function MessageMedia({ url, type }: { url: string; type: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  if (type === 'image') {
    return (
      <>
        <img src={url} alt="Mídia" className="max-w-full rounded-lg cursor-pointer max-h-60 object-cover" loading="lazy" onClick={() => setFullscreen(true)} />
        {fullscreen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFullscreen(false)}>
            <img src={url} alt="Mídia" className="max-w-full max-h-full rounded-xl" />
          </div>
        )}
      </>
    );
  }
  if (type === 'video') return <video src={url} controls className="max-w-full rounded-lg max-h-60" preload="metadata" />;
  if (type === 'audio') return (
    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full w-[240px]">
      <div className="w-9 h-9 rounded-full bg-[hsl(var(--whatsapp-mid))] flex items-center justify-center flex-shrink-0 shadow-sm ml-1">
         <Mic className="w-4 h-4 text-primary-foreground" />
      </div>
      <audio src={url} controls controlsList="nodownload" className="w-full h-9 [&::-webkit-media-controls-enclosure]:bg-transparent" preload="metadata" />
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/5 text-foreground text-xs hover:opacity-80">
      <Download className="w-4 h-4" /><span>Abrir documento</span>
    </a>
  );
}

export default function ChatPanel() {
  const navigate = useNavigate();
  const { storeId, user, userName } = useAuth();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('lead');

  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [leadName, setLeadName] = useState('Chat');
  const [leadPhone, setLeadPhone] = useState('');
  const [controleConversa, setControleConversa] = useState<'bot' | 'humano'>('bot');
  const [storeBotActive, setStoreBotActive] = useState(true);
  const [precisaHumano, setPrecisaHumano] = useState(false);
  const [leadFoto, setLeadFoto] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string; type: string } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [atendenteId, setAtendenteId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Novo');
  const [agents, setAgents] = useState<any[]>([]);
  const [fonte, setFonte] = useState<string>('');
  const [uploadingProfile, setUploadingProfile] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);

  const isHumanName = (name: string | null) => {
    if (!name) return false;
    const clean = name.trim();
    if (clean.length < 2) return false;
    if (/^[\d\s\-+()]+$/.test(clean)) return false;
    if (clean.toLowerCase() === 'lead' || clean.toLowerCase() === 'novo lead') return false;
    return true;
  };

  useEffect(() => {
    if (!leadId) return;
    (supabase as any).from('leads').select('nome, telefone, controle_conversa, precisa_humano, foto_url, atendente_id, fonte, status').eq('id', leadId).maybeSingle()
      .then(({ data }: any) => {
        if (data) { 
          const name = isHumanName(data.nome) ? data.nome : (data.telefone || `Lead #${leadId.slice(0, 6)}`);
          setLeadName(name); 
          setLeadPhone(data.telefone || 'Sem número'); 
          setControleConversa(data.controle_conversa || 'bot'); 
          setPrecisaHumano(data.precisa_humano === true); 
          setLeadFoto(data.foto_url || null);
          setAtendenteId(data.atendente_id);
          setFonte(data.fonte || '');
          setStatus(data.status || 'Novo');
        }
      });

    if (storeId) {
      (supabase as any).from('lojas').select('bot_ativo').eq('id', storeId).maybeSingle()
        .then(({ data }: any) => {
          if (data) setStoreBotActive(data.bot_ativo !== false);
        });
      
      (supabase as any).from('usuarios_loja').select('id, nome').eq('loja_id', storeId)
        .then(({ data }: any) => { if (data) setAgents(data); });
    }
  }, [leadId, storeId]);

  const fetchTimeline = async () => {
    if (!leadId) return;
    setLoadingTimeline(true);
    const { data } = await (supabase as any)
      .from('lead_eventos')
      .select('*')
      .eq('lead_id', leadId)
      .order('criado_em', { ascending: false });
    setTimeline(data || []);
    setLoadingTimeline(false);
  };

  useEffect(() => {
    if (showProfile) fetchTimeline();
  }, [showProfile, leadId]);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !leadId || !storeId) return;
    
    setUploadingProfile(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `leads/${leadId}_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await (supabase as any).from('leads').update({ foto_url: publicUrl }).eq('id', leadId);
      if (updateError) throw updateError;

      setLeadFoto(publicUrl);
      toast.success('Foto de perfil atualizada!');
      fetchTimeline();
    } catch (err: any) {
      toast.error('Erro ao subir foto: ' + err.message);
    } finally {
      setUploadingProfile(false);
    }
  };

  useEffect(() => {
    if (!leadId) return;
    let active = true;
    const loadMessages = async () => {
      setLoading(true);
      const fetchMessages = async () => {
        const { data } = await (supabase as any).from('mensagens').select('*').eq('lead_id', leadId).order('created_at', { ascending: true });
        return data || [];
      };
      let nextMessages = await fetchMessages();
      if (active) { setMessages(nextMessages); setLoading(false); }
      if (nextMessages.length <= 5 && leadPhone && storeId) {
        (async () => {
          try {
            const { data: loja } = await (supabase as any).from('lojas').select('instance_name, instance_status').eq('id', storeId).maybeSingle();
            if (loja?.instance_name && loja?.instance_status === 'connected') {
              await supabase.functions.invoke('whatsapp-connection', { body: { action: 'sync_chat', instance: loja.instance_name, store_id: storeId, phone: leadPhone } });
              if (active) { const synced = await fetchMessages(); setMessages(synced); }
            }
          } catch (e) { console.warn('Background sync failed:', e); }
        })();
      }
    };
    loadMessages();
    const channel = supabase.channel(`chat-${leadId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `lead_id=eq.${leadId}` }, (payload: any) => {
      const newMsg = payload.new as MsgRow;
      setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
    }).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [leadId, leadPhone, storeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const assumeConversation = async () => {
    if (!leadId) return;
    await (supabase as any).from('leads').update({ controle_conversa: 'humano', precisa_humano: false, bot_enabled: false }).eq('id', leadId);
    setControleConversa('humano'); setPrecisaHumano(false);
    toast.success('Conversa assumida!');
  };

  const returnToBot = async () => {
    if (!leadId) return;
    await (supabase as any).from('leads').update({ controle_conversa: 'bot', precisa_humano: false, bot_enabled: true }).eq('id', leadId);
    setControleConversa('bot'); setPrecisaHumano(false);
    toast.success('Bot reactivado!');
  };

  const scheduleFollowup = async () => {
    const note = window.prompt('Sobre o que é este follow-up? (Ex: Ligar pra fechar proposta)');
    if (!note || !leadId) return;
    
    await (supabase as any).from('leads').update({ status: 'Aguardando', precisa_humano: true }).eq('id', leadId);
    await (supabase as any).from('mensagens').insert({
      lead_id: leadId, lead_nome: leadName,
      conteudo: `[SISTEMA] 🔔 Follow-up Agendado: ${note}`,
      tipo: 'recebida',
      is_bot: false, loja_id: storeId,
    });
    setPrecisaHumano(true);
    toast.success('Follow-up agendado e status alterado!');
  };

  const getMediaType = (file: File) => file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'document';
  const handleFileSelect = (accept: string) => { if (fileRef.current) { fileRef.current.accept = accept; fileRef.current.click(); } setShowAttach(false); };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 16 * 1024 * 1024) { toast.error('Máx. 16MB'); return; } setMediaPreview({ file, url: URL.createObjectURL(file), type: getMediaType(file) }); e.target.value = ''; };
  const clearMedia = () => { if (mediaPreview) { URL.revokeObjectURL(mediaPreview.url); setMediaPreview(null); } };

  const sendMessage = async () => {
    if ((!input.trim() && !mediaPreview) || !leadId || sending) return;
    
    if (!storeId) {
      toast.error('Loja não identificada. Tente recarregar a página.');
      return;
    }

    const text = input.trim();
    setInput('');
    setSending(true);

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (mediaPreview) {
        const ext = mediaPreview.file.name.split('.').pop() || 'bin';
        const path = `${storeId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, mediaPreview.file);
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
        mediaUrl = urlData.publicUrl;
        mediaType = mediaPreview.type;
        clearMedia();
      }

      const messageText = mediaUrl ? (text || `[${mediaType === 'image' ? '📷' : '📄'} Mídia]`) : text;
      
      const { data: newMsg, error: insertError } = await (supabase as any).from('mensagens').insert({
        lead_id: leadId,
        lead_nome: leadName,
        conteudo: messageText,
        tipo: 'enviada',
        is_bot: false,
        loja_id: storeId,
        respondido_por: user?.id || null,
        respondido_por_nome: userName || null,
        media_url: mediaUrl,
        media_type: mediaType,
      }).select().single();

      if (insertError) throw insertError;

      // Optimistic update: Add the message to state immediately
      if (newMsg) {
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
      }

      if (leadPhone) {
        // ... rest of the function for WhatsApp ...
        const { data: loja } = await (supabase as any).from('lojas').select('instance_name').eq('id', storeId).maybeSingle();
        const inst = loja?.instance_name || 'Whats';
        const body: Record<string, string> = { instance: inst, number: leadPhone.replace(/\D/g, '') };
        
        if (mediaUrl) {
          body.mediaUrl = mediaUrl;
          body.mediaType = mediaType || 'image';
          body.caption = text || '';
        } else {
          body.text = text;
        }

        const { data, error: whatsError } = await supabase.functions.invoke('send-whatsapp', { body });
        if (whatsError || !data?.success) {
          toast.warning('Mensagem salva no sistema, mas houve um atraso ao enviar para o WhatsApp.');
        }
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error(`Erro ao enviar: ${err.message || 'Verifique sua conexão'}`);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const isHumanMode = controleConversa === 'humano';

  return (
    <div className="fixed inset-0 flex bg-[hsl(var(--whatsapp-bg))] overflow-hidden">
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${showProfile ? 'mr-[350px]' : ''}`}>
        {/* Header - Refined with slate-950/primary for high-end look */}
        <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0 bg-background border-b border-border shadow-sm z-10 transition-colors">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-foreground hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0 border border-border/50 shadow-inner">
            {leadFoto ? (
              <img src={leadFoto} alt={leadName} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = ''; (e.target as any).style.display = 'none'; }} />
            ) : null}
            <span className="text-secondary-foreground font-bold text-sm tracking-tight">{leadName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-foreground text-[15px] truncate">{leadName}</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{leadPhone}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowProfile(!showProfile)} 
              className={`p-2 rounded-xl transition-all ${showProfile ? 'bg-primary text-primary-foreground shadow-glow' : 'text-foreground hover:bg-secondary'}`}
              title="Informações do Lead"
            >
              <Info className="w-5 h-5" />
            </button>
            <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm 
              ${!storeBotActive ? 'filter-inactive' : 
                isHumanMode ? 'bg-orange-500 text-white shadow-glow' : 
                'filter-active'}`}>
              {!storeBotActive ? (
                <><X className="w-[11px] h-[11px] mb-[1px]" /> <span className="leading-none text-[8px]">BOT OFF</span></>
              ) : isHumanMode ? (
                <><User className="w-[11px] h-[11px] mb-[1px]" /> <span className="leading-none text-[8px]">HUMANO</span></>
              ) : (
                <><Bot className="w-[11px] h-[11px] mb-[1px]" /> <span className="leading-none text-[8px]">BOT</span></>
              )}
            </div>
            <button onClick={scheduleFollowup} className="p-2 rounded-xl text-foreground hover:bg-secondary transition-colors" title="Agendar Follow-up" >
              <CalendarClock className="w-5 h-5" />
            </button>
            {isHumanMode ? (
              <button onClick={returnToBot} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl filter-inactive text-[11px] font-bold hover:bg-muted transition-all">
                <RotateCcw className="w-3.5 h-3.5 mb-[1px]" /> <span className="leading-none">Bot</span>
              </button>
            ) : (
              <button onClick={assumeConversation} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-all shadow-glow">
                <UserCheck className="w-3.5 h-3.5 mb-[1px]" /> <span className="leading-none">Assumir</span>
              </button>
            )}
          </div>
        </div>

        {/* Human attention banner */}
        <AnimatePresence>
          {precisaHumano && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-orange-500 px-4 py-2 flex items-center gap-3 overflow-hidden shadow-glow">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-100 animate-pulse" />
              <p className="text-[11px] text-orange-50 font-black uppercase tracking-widest">Aguardando Resposta Manual</p>
              <button onClick={assumeConversation} className="ml-auto text-[10px] bg-white text-orange-600 px-3 py-1 rounded-full font-black uppercase tracking-tighter hover:bg-white/90 transition-colors shadow-sm">Resolver Agora</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages area with dynamic height */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 chat-bg relative scroll-smooth overflow-x-hidden">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary/50" /></div>}
          {!loading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-30 select-none grayscale translate-y-[-10%]">
              <MessageSquare className="w-16 h-16 mb-4 text-primary" />
              <p className="text-sm font-bold uppercase tracking-[0.2em]">Inicie a conversa</p>
            </div>
          )}
          {messages.map(msg => {
            const isSent = msg.tipo !== 'recebida';
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, scale: 0.95, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[85%] sm:max-w-[70%] px-2.5 py-1.5 shadow-sm
                  ${isSent
                    ? 'bg-[hsl(var(--whatsapp-bubble-sent))] text-white rounded-[16px] rounded-tr-none border border-black/5 shadow-md'
                    : 'bg-[hsl(var(--whatsapp-bubble-received))] text-foreground rounded-[16px] rounded-tl-none border border-border/50 shadow-md'
                  }`}
                >
                  {msg.media_url && msg.media_type && (
                    <div className="mb-1 rounded-lg overflow-hidden mt-1"><MessageMedia url={msg.media_url} type={msg.media_type} /></div>
                  )}
                  {msg.conteudo && (() => {
                    const isPlaceholder = /^\[([📷📹🎵📄🏷️👤📍]|Mídia)/.test(msg.conteudo) || msg.conteudo === '[Mídia]' || typeof msg.conteudo !== 'string';
                    if (isPlaceholder && msg.media_url) return null;
                    
                    // Highlight system notifications differently
                    if (msg.conteudo.startsWith('[SISTEMA]')) {
                       return <p className="whitespace-pre-wrap break-words text-[13px] leading-snug font-medium italic text-orange-600 dark:text-orange-400 p-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg">{msg.conteudo.replace('[SISTEMA] ', '')}</p>;
                    }
                    
                    return <p className="whitespace-pre-wrap break-words text-[14px] leading-[19px] mt-0.5 px-1 font-normal">{msg.conteudo}</p>;
                  })()}
                  <div className={`flex items-center gap-1 mt-1 justify-end opacity-80 float-right ml-3 pt-1 text-[10px]`}>
                    {isSent && !msg.is_bot && msg.respondido_por_nome && <span className="font-bold uppercase tracking-widest opacity-80">{msg.respondido_por_nome}</span>}
                    <time className={`font-medium ${isSent ? 'text-white/80' : 'text-muted-foreground'}`}>{formatTime(msg.created_at)}</time>
                    {isSent && msg.is_bot && <Bot className="w-3 h-3 text-white/80" />}
                    {isSent && !msg.is_bot && <CheckCheck className="w-[15px] h-[15px] text-white/90" />}
                  </div>
                  <div className="clear-both" />
                </div>
              </motion.div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Media & Attach Controls */}
        <AnimatePresence>
          {mediaPreview && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-card border-t border-border p-4 flex items-center gap-4 z-20">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-secondary shadow-elevated border border-border">
                {mediaPreview.type === 'image' ? <img src={mediaPreview.url} alt="preview" className="w-full h-full object-cover" /> : <FileText className="w-8 h-8 text-primary" />}
                <button onClick={clearMedia} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white shadow-lg flex items-center justify-center translate-x-1/3 -translate-y-1/3 border-2 border-card"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground truncate">{mediaPreview.file.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{mediaPreview.type}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAttach && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-card/95 backdrop-blur-md border-t border-border px-6 py-4 flex gap-8 justify-center z-20">
              <button onClick={() => handleFileSelect('image/*')} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all border border-primary/10 shadow-sm"><Image className="w-6 h-6 text-primary" /></div><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Foto</span></button>
              <button onClick={() => handleFileSelect('video/*')} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-all border border-amber-500/10 shadow-sm"><Camera className="w-6 h-6 text-amber-500" /></div><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vídeo</span></button>
              <button onClick={() => handleFileSelect('*/*')} className="flex flex-col items-center gap-2 group"><div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all border border-blue-500/10 shadow-sm"><FileText className="w-6 h-6 text-blue-500" /></div><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Doc</span></button>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={fileRef} type="file" className="hidden" onChange={onFileChange} />

        {/* Input bar - More contrast and border */}
        <footer className="bg-card border-t-2 border-primary/20 bg-gradient-to-b from-card to-secondary/30 px-4 py-3 pb-6 sm:pb-3 flex gap-3 flex-shrink-0 z-30 min-h-[76px] items-end">
          <button onClick={() => setShowAttach(!showAttach)} className={`w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all ${showAttach ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'}`}>
            <Plus className="w-5 h-5" />
          </button>
          <div className="flex-1 relative flex items-end">
            <textarea
              rows={1}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Escreva sua mensagem aqui..."
              className="w-full bg-background text-foreground text-[15px] font-medium rounded-2xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all resize-none min-h-[44px] max-h-[120px] shadow-sm border border-border/60"
            />
            <button onClick={sendMessage} disabled={sending || (!input.trim() && !mediaPreview)}
              className="absolute right-1.5 bottom-1.5 w-[34px] h-[34px] rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-glow">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
          </div>
        </footer>
      </div>

      {/* Sidebar Profile & Timeline */}
      <AnimatePresence>
        {showProfile && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[350px] bg-background border-l border-border shadow-2xl z-40 flex flex-col"
          >
            <div className="p-6 border-b border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Perfil do Lead</h3>
                <button onClick={() => setShowProfile(false)} className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col items-center">
                <div 
                  className="w-24 h-24 rounded-[32px] bg-secondary border-4 border-card shadow-card overflow-hidden flex items-center justify-center relative group"
                  onClick={() => profileFileRef.current?.click()}
                >
                  {uploadingProfile ? (
                     <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  ) : leadFoto ? (
                    <img src={leadFoto} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground/30" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <input ref={profileFileRef} type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
                <h4 className="mt-4 font-black text-xl text-foreground text-center line-clamp-1">{leadName}</h4>
                <p className="text-sm text-muted-foreground font-mono">{leadPhone}</p>
                <div className="mt-3 flex gap-2">
                   <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">{fonte || 'Origem desconhecida'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Responsibility & Status */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <LayoutDashboard className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Controles e Status</span>
                </div>
                <div className="space-y-4 bg-secondary/30 p-4 rounded-3xl border border-border/40">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2 px-1">Status do Pipeline</label>
                    <select 
                      value={status}
                      onChange={(e) => {
                         const val = e.target.value;
                         setStatus(val);
                         (supabase as any).from('leads').update({ status: val }).eq('id', leadId).then(() => {
                           fetchTimeline();
                           toast.success(`Status: ${val}`);
                         });
                      }}
                      className="w-full bg-card px-4 py-3 rounded-2xl border border-border/60 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {['Novo', 'Interessado', 'Aguardando', 'Vendido', 'Perdido'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2 px-1">Atendente Responsável</label>
                    <select 
                      value={atendenteId || 'none'}
                      onChange={(e) => {
                         const val = e.target.value === 'none' ? null : e.target.value;
                         setAtendenteId(val);
                         (supabase as any).from('leads').update({ atendente_id: val }).eq('id', leadId).then(() => {
                           fetchTimeline();
                           toast.success('Atendente alterado!');
                         });
                      }}
                      className="w-full bg-card px-4 py-3 rounded-2xl border border-border/60 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="none">Nenhum Atendente</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <History className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Linha do Tempo</span>
                  </div>
                  <button onClick={fetchTimeline} disabled={loadingTimeline} className="p-1.5 rounded-lg hover:bg-secondary text-primary transition-colors disabled:opacity-30">
                     <RotateCcw className={`w-3.5 h-3.5 ${loadingTimeline ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                
                <div className="relative space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
                  {timeline.map((event, idx) => (
                    <div key={event.id} className="relative pl-8 animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10">
                        {event.tipo === 'mudanca_status' ? <LayoutDashboard className="w-3 h-3 text-primary" /> : <Info className="w-3 h-3 text-primary" />}
                      </div>
                      <p className="text-xs font-bold text-foreground leading-tight">{event.descritivo}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{new Date(event.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                  
                  {timeline.length === 0 && !loadingTimeline && (
                    <div className="text-center py-10 opacity-30 italic text-[11px] text-muted-foreground">Sem histórico registrado.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card">
              <button disabled className="w-full py-4 rounded-2xl bg-secondary text-muted-foreground font-black text-[10px] uppercase tracking-widest opacity-50 cursor-not-allowed">
                Exportar Histórico PDF
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
