import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PURCHASE_KEYWORDS = [
  'quero comprar', 'quero encomendar', 'fazer pedido', 'reservar',
  'comprar', 'pagar', 'encomenda', 'quero pedir', 'fechar pedido',
  'quero esse', 'quero este', 'vou levar', 'pode reservar',
];

const HUMAN_REQUEST_KEYWORDS = [
  'falar com humano', 'atendente', 'pessoa real', 'falar com alguém',
  'quero falar com uma pessoa', 'atendimento humano', 'operador',
  'falar com gerente', 'responsável', 'supervisor',
];

const COMPLAINT_KEYWORDS = [
  'reclamação', 'reclamar', 'devolução', 'devolver', 'defeito',
  'problema', 'não funciona', 'quebrado', 'errado', 'insatisfeito',
  'reembolso', 'trocar', 'troca', 'cancelar pedido', 'cancelamento',
];

const LOW_CONFIDENCE_KEYWORDS = [
  'não entendi', 'pode explicar melhor', 'como funciona',
  'não sei', 'estou confuso', 'ajuda', 'help',
];

const NEGOTIATION_KEYWORDS = [
  'desconto', 'mais barato', 'negociar preço', 'preço especial', 'preco',
  'baixar o preço', 'fazer por menos', 'melhor preço', 'promoção',
];

const URGENCY_KEYWORDS = [
  'quero pagar agora', 'como pago já', 'me passa o iban',
  'dados para transferência', 'pagar já', 'preciso urgente',
];

const CUSTOM_REQUEST_KEYWORDS = [
  'personalizado', 'sob medida', 'fora do catálogo', 'não tem no catálogo',
  'produto especial', 'encomenda especial',
];

const IRRITATION_KEYWORDS = [
  'demora', 'ninguém responde', 'péssimo', 'horrível', 'lixo',
  'muito tempo', 'cansado de esperar', 'ridículo', 'palhaçada',
  'vergonha', 'nunca mais', 'pior atendimento',
];

type EscalationReason = 'purchase_intent' | 'human_request' | 'complaint' | 'low_confidence' | 'negotiation' | 'urgency' | 'custom_request' | 'irritation';

function detectEscalation(text: string): { shouldEscalate: boolean; reason: EscalationReason | null } {
  const lower = text.toLowerCase();
  if (HUMAN_REQUEST_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'human_request' };
  if (COMPLAINT_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'complaint' };
  if (IRRITATION_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'irritation' };
  if (NEGOTIATION_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'negotiation' };
  if (URGENCY_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'urgency' };
  if (CUSTOM_REQUEST_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'custom_request' };
  if (PURCHASE_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: false, reason: 'purchase_intent' };
  if (LOW_CONFIDENCE_KEYWORDS.some(k => lower.includes(k))) return { shouldEscalate: true, reason: 'low_confidence' };
  return { shouldEscalate: false, reason: null };
}

const ESCALATION_MESSAGES: Record<string, string> = {
  human_request: 'Encaminho a sua conversa para um especialista. Todo o histórico e agendamento estão disponíveis para garantir continuidade do atendimento.',
  complaint: 'Peço desculpa pelo incómodo. Encaminho a sua conversa para um especialista que tratará da sua reclamação com prioridade.',
  low_confidence: 'Encaminho a sua conversa para um especialista que poderá esclarecer todas as suas dúvidas detalhadamente.',
  irritation: 'Lamento muito a sua experiência. Encaminho a sua conversa para um especialista agora mesmo para resolvermos isto rapidamente.',
  negotiation: 'Encaminho a sua conversa para um especialista comercial para lhe oferecer as melhores condições.',
  urgency: 'Com certeza. Encaminho a sua conversa para um especialista para finalizarmos o seu pedido com a máxima urgência.',
  custom_request: 'Encaminho a sua conversa para um especialista que ajudará a personalizar o seu pedido.',
};

async function notifyAdminEscalation(
  supabase: any, _baseUrl: string, _instanceName: string, _apiKey: string,
  storeId: string, leadName: string, lastMessage: string, reason: string
) {
  console.log(`[escalation] Lead "${leadName}" needs human attention. Reason: ${reason}. Message: "${lastMessage.slice(0, 100)}". Store: ${storeId}`);
}

function extractMedia(message: any): { label: string; type: string; mediaObj: any } | null {
  if (!message) return null;
  if (message.imageMessage) return { label: '[FOTO] Imagem', type: 'image', mediaObj: message.imageMessage };
  if (message.videoMessage) return { label: '[VIDEO] Vídeo', type: 'video', mediaObj: message.videoMessage };
  if (message.audioMessage) return { label: '[AUDIO] Áudio', type: 'audio', mediaObj: message.audioMessage };
  if (message.pttMessage) return { label: '[AUDIO] Áudio', type: 'audio', mediaObj: message.pttMessage };
  if (message.documentMessage) return { label: '[DOC] Documento', type: 'document', mediaObj: message.documentMessage };
  if (message.stickerMessage) return { label: '[STICKER] Sticker', type: 'image', mediaObj: message.stickerMessage };
  if (message.contactMessage || message.contactsArrayMessage) return { label: '[CONTATO] Contacto', type: 'document', mediaObj: null };
  if (message.locationMessage || message.liveLocationMessage) return { label: '[LOCAL] Localização', type: 'document', mediaObj: null };
  return null;
}

async function persistMedia(
  supabase: any,
  baseUrl: string,
  instanceName: string,
  apiKey: string,
  messageId: string,
  mediaType: string,
  storeId: string,
  mediaObj: any,
): Promise<string | null> {
  try {
    const directUrl = mediaObj?.url || mediaObj?.directPath;
    const mediaRes = await fetch(`${baseUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ message: { key: { id: messageId } }, convertToMp4: false }),
    });

    if (!mediaRes.ok) {
      console.warn(`[webhook] Failed to fetch media base64: ${mediaRes.status}`);
      if (directUrl && directUrl.startsWith('http')) return directUrl;
      return null;
    }

    const mediaData = await mediaRes.json();
    const base64 = mediaData?.base64;
    const mimeType = mediaData?.mimetype || mediaObj?.mimetype || 'application/octet-stream';

    if (!base64) {
      console.warn('[webhook] No base64 in media response');
      if (directUrl && directUrl.startsWith('http')) return directUrl;
      return null;
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a',
      'application/pdf': 'pdf',
    };
    const ext = extMap[mimeType] || mimeType.split('/')[1] || 'bin';
    const fileName = `${storeId}/media/${Date.now()}-${messageId.slice(-8)}.${ext}`;

    const binaryData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const { error: uploadErr } = await supabase.storage
      .from('chat-media')
      .upload(fileName, binaryData, { contentType: mimeType, upsert: true });

    if (uploadErr) {
      console.error('[webhook] Media upload error:', uploadErr);
      return null;
    }

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);
    return urlData?.publicUrl || null;
  } catch (e) {
    console.error('[webhook] persistMedia error:', e);
    return null;
  }
}

async function persistProfilePicture(supabase: any, storeId: string, leadId: string, imageUrl: string, phone: string, logs: string[]): Promise<string | null> {
  try {
    logs.push(`[webhook] Persisting profile picture for ${phone}...`);
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const fileName = `${storeId}/profiles/${leadId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (uploadError) {
      logs.push(`[webhook] Storage upload error for ${phone}: ${JSON.stringify(uploadError)}`);
      return imageUrl;
    }

    const { data } = supabase.storage.from('chat-media').getPublicUrl(fileName);
    logs.push(`[webhook] Profile picture persisted successfully to: ${data.publicUrl}`);
    return data.publicUrl;
  } catch (e: any) {
    logs.push(`[webhook] Error persisting profile picture for ${phone}: ${e.message}`);
    return imageUrl;
  }
}

async function fetchProfileInfo(supabase: any, evolutionUrl: string, instanceName: string, apiKey: string, phone: string, leadId: string, storeId: string, logs: string[] = []) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  
  try {
    const rawUrl = evolutionUrl.replace(/\/+$/, '');
    const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    
    logs.push(`[webhook] Fetching profile info for ${phone}...`);
    
    const profileRes = await fetch(`${baseUrl}/chat/fetchProfile/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phone }),
      signal: controller.signal
    });

    if (profileRes.ok) {
      const pData = await profileRes.json();
      const pushName = pData?.pushName || pData?.name || pData?.data?.pushName;
      if (pushName && !/^[\d\s\-+()]+$/.test(pushName)) {
        logs.push(`[webhook] Found real name for ${phone}: ${pushName}`);
        await supabase.from('leads').update({ nome: pushName }).eq('id', leadId);
      }
    }

    const picRes = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phone }),
      signal: controller.signal
    });
    
    if (picRes.ok) {
      const data = await picRes.json();
      const transientUrl = data?.profilePictureUrl || data?.url || data?.data?.profilePictureUrl || data?.data?.url;
      
      if (transientUrl && transientUrl.startsWith('http')) {
        const permanentUrl = await persistProfilePicture(supabase, storeId, leadId, transientUrl, phone, logs);
        await supabase.from('leads').update({ foto_url: permanentUrl }).eq('id', leadId);
        return permanentUrl;
      }
    }
  } catch (e: any) {
    logs.push(`[webhook] Error fetching profile info for ${phone}: ${e?.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

Deno.serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');

  try {
    const body = await req.json();

    if (body.action === 'sync_all_profiles') {
      const logs: string[] = [];
      const storeId = body.store_id;
      let query = supabase.from('leads').select('id, telefone, loja_id, foto_url');
      const filterOr = 'foto_url.is.null,foto_url.ilike.%evolution%';
      if (storeId) {
        query = query.eq('loja_id', storeId).or(filterOr);
      } else {
        query = query.or(filterOr);
      }
      const { data: leads, error: leadsErr } = await query;
      if (leadsErr) return new Response(JSON.stringify({ ok: false, error: 'db_error', logs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      let targetLeads = (leads || []).slice(0, 10);
      const { data: lojas } = await supabase.from('lojas').select('id, instance_name');
      const lojaMap = new Map(lojas?.map((l: any) => [l.id, l.instance_name]));

      let count = 0;
      for (const lead of targetLeads) {
        try {
          const instance = lojaMap.get(lead.loja_id) || "Whats";
          if (lead.telefone && EVOLUTION_API_URL && EVOLUTION_API_KEY) {
            await fetchProfileInfo(supabase, EVOLUTION_API_URL, instance, EVOLUTION_API_KEY, lead.telefone.replace(/\D/g, ''), lead.id, lead.loja_id, logs);
            count++;
          }
        } catch {}
      }
      return new Response(JSON.stringify({ ok: true, processed: count, logs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rawEvent = body.event || body.eventType || body.type || '';
    const eventNormalized = rawEvent.toLowerCase().replace(/_/g, '.');

    if (eventNormalized === 'messages.upsert') {
      const data = body.data || body;
      const instance = body.instance || body.instanceName || body.instance_name || 'Whats';
      if (!data) return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const key = data.key;
      const fromMe = key?.fromMe || false;
      const remoteJid = key?.remoteJid || '';
      const messageId = key?.id || '';

      if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.includes('@lid') || !remoteJid.endsWith('@s.whatsapp.net')) {
        return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const phone = remoteJid.replace('@s.whatsapp.net', '');
      const pushName = data.pushName || data.notifyName || body.pushName || body.notifyName || '';
      const messageObj = data.message || data.msg || {};
      const messageText = messageObj?.conversation || messageObj?.extendedTextMessage?.text || messageObj?.imageMessage?.caption || messageObj?.videoMessage?.caption || messageObj?.documentMessage?.caption || '';
      const media = extractMedia(messageObj);
      const mediaLabel = media?.label || null;
      const contentToSave = messageText || (mediaLabel ? `[${mediaLabel}]` : '[Mídia]');

      let storeId: string | null = null;
      const instanceName = String(instance);
      const { data: storeRow } = await supabase.from('lojas').select('id').eq('instance_name', instanceName).maybeSingle();
      if (storeRow) storeId = storeRow.id;

      if (!storeId) return new Response(JSON.stringify({ ok: false, error: 'no_store' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      // [STOP] BLOQUEIO DE DUPLICADOS — INSERT-first elimina race conditions
      if (messageId && !fromMe) {
        try {
          const { error: dupError } = await supabase.from('webhook_logs').insert({ message_id: messageId });
          if (dupError) {
            if (dupError.code === '23505') {
              console.log(`[webhook] Mensagem duplicada bloqueada: ${messageId}`);
              return new Response(JSON.stringify({ ok: true, status: 'duplicated' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } else {
              console.warn(`[webhook] Ignorando erro do webhook_logs: ${dupError.message}`);
            }
          }
        } catch (e) {
          console.warn('[webhook] webhook_logs indisponível, continuando sem idempotência.');
        }
      }

      let persistedMediaUrl: string | null = null;
      let persistedMediaType: string | null = media?.type || null;
      const rawUrlString = EVOLUTION_API_URL ? EVOLUTION_API_URL.replace(/\/+$/, '') : '';
      const baseUrl = rawUrlString.startsWith('http') ? rawUrlString : `https://${rawUrlString}`;
      if (media && media.mediaObj && EVOLUTION_API_KEY && EVOLUTION_API_URL && messageId) {
        persistedMediaUrl = await persistMedia(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, messageId, media.type, storeId, media.mediaObj);
      }

      let leadId = null;
      let leadName = pushName || phone;
      let leadControle = 'bot';
      let leadBotEnabled = true;
      let isFirstMessage = false;

      if (!fromMe) {
        const { data: existingLead } = await supabase.from('leads').select('id, nome, controle_conversa, bot_enabled').eq('telefone', phone).eq('loja_id', storeId).maybeSingle();
        if (existingLead) {
          leadId = existingLead.id;
          leadName = existingLead.nome || pushName || phone;
          leadControle = existingLead.controle_conversa || 'bot';
          if (existingLead.bot_enabled === false) leadBotEnabled = false;
          await supabase.from('leads').update({ followup_count: 0, ultimo_followup: null }).eq('id', leadId);
        } else {
          isFirstMessage = true;
          const { data: newLead } = await supabase.from('leads').insert({ nome: pushName || phone, telefone: phone, fonte: 'whatsapp', loja_id: storeId, interesse: messageText || 'Primeiro contacto', status: 'novo', bot_enabled: true, controle_conversa: 'bot', precisa_humano: false, tags: ['novo'] }).select('id').single();
          if (newLead) { leadId = newLead.id; leadControle = 'bot'; fetchProfileInfo(supabase, baseUrl, instanceName, EVOLUTION_API_KEY as string, phone, newLead.id, storeId); }
        }
      } else {
        const { data: existingLead } = await supabase.from('leads').select('id, nome').eq('telefone', phone).eq('loja_id', storeId).maybeSingle();
        if (existingLead) { leadId = existingLead.id; leadName = existingLead.nome || phone; }
      }

      const msgInsert: any = { lead_id: leadId, lead_nome: leadName, conteudo: contentToSave, tipo: fromMe ? 'enviada' : 'recebida', is_bot: false, loja_id: storeId };
      if (persistedMediaUrl) { msgInsert.media_url = persistedMediaUrl; msgInsert.media_type = persistedMediaType; }
      await supabase.from('mensagens').insert(msgInsert);

      const hasContent = messageText || media;
      if (!fromMe && hasContent && leadId && storeId && EVOLUTION_API_KEY && EVOLUTION_API_URL) {
        const { data: storeData } = await supabase.from('lojas').select('bot_ativo').eq('id', storeId).maybeSingle();
        if (storeData?.bot_ativo !== false && leadControle !== 'humano' && leadBotEnabled !== false) {
          const textForEscalation = messageText || '';
          const escalation = detectEscalation(textForEscalation);

          // --------------------------------------------------------------------------------
          // AUTOMATION ENGINE (ZAP CHAT FLOWS)
          // --------------------------------------------------------------------------------
          let automationExecuted = false;
          let matchedAuto: any = null;
          let startingNodeId: string | null = null;
          
          // 0. Check if lead is waiting for input from a previous inputNode
          const { data: waitingInput } = await supabase.from('automacoes_pendentes').select('*').eq('lead_id', leadId).eq('loja_id', storeId).eq('status', 'waiting_input').maybeSingle();
          
          if (waitingInput) {
            const { data: resumeAuto } = await supabase.from('automacoes').select('*').eq('id', waitingInput.automacao_id).single();
            if (resumeAuto) {
              matchedAuto = resumeAuto;
              automationExecuted = true;
              console.log(`[webhook] Retomando Automação ${matchedAuto.nome} do nó ${waitingInput.node_id}`);
              
              const nodes = matchedAuto.nodes || [];
              const inputNode = nodes.find((n: any) => n.id === waitingInput.node_id);
              if (inputNode) {
                const varName = inputNode.data?.variable || 'resposta';
                const { data: leadData } = await supabase.from('leads').select('variaveis').eq('id', leadId).single();
                const vars = leadData?.variaveis || {};
                vars[varName] = messageText;
                await supabase.from('leads').update({ variaveis: vars }).eq('id', leadId);
              }
              
              await supabase.from('automacoes_pendentes').delete().eq('id', waitingInput.id);
              
              const edges = matchedAuto.edges || [];
              const edgeOut = edges.find((e: any) => e.source === waitingInput.node_id);
              if (edgeOut) {
                startingNodeId = edgeOut.target;
              } else {
                matchedAuto = null; // Nowhere to go
              }
            } else {
              await supabase.from('automacoes_pendentes').delete().eq('id', waitingInput.id);
            }
          }
          
          if (!matchedAuto) {
            const { data: activeAutomations } = await supabase
              .from('automacoes')
              .select('*')
              .eq('loja_id', storeId)
              .eq('ativo', true);
              
            if (activeAutomations && activeAutomations.length > 0) {
              // Normalize text: remove accents for comparison
              const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
              const msgNormalized = normalize(textForEscalation);

              // Priority: keyword matches first, then first_message, then any_message (catch-all LAST)
              const sorted = [...activeAutomations].sort((a: any, b: any) => {
                const getPriority = (auto: any) => {
                  const tn = (auto.nodes || []).find((n: any) => n.type === 'triggerNode');
                  const t = tn?.data?.triggerType || 'keyword';
                  if (t === 'keyword') return 0;
                  if (t === 'first_message') return 1;
                  if (t === 'any_message') return 2;
                  return 3;
                };
                return getPriority(a) - getPriority(b);
              });

              matchedAuto = sorted.find((a: any) => {
                const triggerNode = (a.nodes || []).find((n: any) => n.type === 'triggerNode');
                if (!triggerNode) return false;
                
                const tType = triggerNode.data?.triggerType || 'keyword';
                
                if (tType === 'first_message') return isFirstMessage;
                if (tType === 'any_message') return true;
                if (tType === 'tag_added') return false; // Handled elsewhere
                
                // keyword logic — normalized for accents
                const keywordLabel = triggerNode.data?.label || a.trigger_keyword;
                if (!keywordLabel || keywordLabel.trim() === '') return false;
                const kws = keywordLabel.split(',').map((k: string) => normalize(k));
                if (kws.includes('*')) return true;
                // Exact match first, then partial
                return kws.some((kw: string) => msgNormalized === kw) || kws.some((kw: string) => msgNormalized.includes(kw));
              });
              
              if (matchedAuto) {
                const triggerNode = matchedAuto.nodes.find((n: any) => n.type === 'triggerNode');
                const edgeOut = matchedAuto.edges.find((e: any) => e.source === triggerNode?.id);
                if (edgeOut) startingNodeId = edgeOut.target;
              }
            }
          }

          if (matchedAuto && startingNodeId) {
            automationExecuted = true;
            console.log(`[webhook] Executando Automação: ${matchedAuto.nome}`);
            
            let currentNodes = matchedAuto.nodes || [];
            let currentEdges = matchedAuto.edges || [];
            
            // Normalize text for condition matching (handles accents like ç, ã, etc.)
            const normalizeText = (s: string) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

            // Replace variables like {{nome}}, {{email}}, etc.
            const parseVariables = async (text: string, lId: string) => {
              if (!text || !text.includes('{{')) return text;
              const { data: ld } = await supabase.from('leads').select('nome, variaveis').eq('id', lId).single();
              let result = text.replace(/{{nome}}/g, ld?.nome || '');
              if (ld?.variaveis) {
                for (const [key, value] of Object.entries(ld.variaveis)) {
                  result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
                }
              }
              return result;
            };

            let nextNode = currentNodes.find((n: any) => n.id === startingNodeId);
            let visitedNodes = new Set();
            let executionSteps = 0;
            const getNextNode = (currentId: string, nodes: any[], edges: any[]) => {
              const edgeOut = edges.find((e: any) => e.source === currentId);
              if (edgeOut) return nodes.find((n: any) => n.id === edgeOut.target);
              return null;
            };
            
            while (nextNode) {
              if (visitedNodes.has(nextNode.id) || executionSteps > 50) {
                console.log(`[webhook] Loop detetado ou limite excedido (nó ${nextNode.id}). Interrompendo.`);
                break;
              }
              visitedNodes.add(nextNode.id);
              executionSteps++;

              // ── messageNode ──────────────────────────────────────────────────
              if (nextNode.type === 'messageNode') {
                const msgTextRaw = nextNode.data?.label || '';
                if (msgTextRaw) {
                  const msgText = await parseVariables(msgTextRaw, leadId);
                  await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                    body: JSON.stringify({ number: phone, text: msgText, options: { delay: 1500, presence: 'composing' } }),
                  });
                  await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: msgText, tipo: 'enviada', is_bot: true, loja_id: storeId });
                }
              }
              // ── mediaNode ────────────────────────────────────────────────────
              else if (nextNode.type === 'mediaNode') {
                const mediaUrl = nextNode.data?.mediaUrl;
                if (mediaUrl) {
                  const isImage = mediaUrl.match(/\.(jpeg|jpg|gif|png)(\?.*)?$/i);
                  const isAudio = mediaUrl.match(/\.(ogg|mp3|wav|m4a|aac)(\?.*)?$/i);
                  const isVideo = mediaUrl.match(/\.(mp4|mov|avi|mkv)(\?.*)?$/i);
                  let mType = 'document';
                  if (isImage) mType = 'image';
                  else if (isAudio) mType = 'audio';
                  else if (isVideo) mType = 'video';
                  const options: any = { delay: 1500 };
                  if (isAudio) options.presence = 'recording';
                  if (isAudio) {
                    await fetch(`${baseUrl}/message/sendWhatsAppAudio/${instanceName}`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                      body: JSON.stringify({ number: phone, audio: mediaUrl, delay: 1500, encoding: true }),
                    });
                  } else {
                    await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                      body: JSON.stringify({ number: phone, mediatype: mType, media: mediaUrl, options }),
                    });
                  }
                  await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: '[Mídia da Automação]', media_url: mediaUrl, media_type: mType, tipo: 'enviada', is_bot: true, loja_id: storeId });
                }
              }
              // ── actionNode ───────────────────────────────────────────────────
              else if (nextNode.type === 'actionNode') {
                const actionType = nextNode.data?.actionType || 'add_tag';
                const actionValue = String(nextNode.data?.actionValue || '').trim();
                if (actionType === 'add_tag' && actionValue) {
                  const { data: leadData } = await supabase.from('leads').select('tags').eq('id', leadId).single();
                  const existingTags = leadData?.tags || [];
                  if (!existingTags.includes(actionValue)) {
                    await supabase.from('leads').update({ tags: [...existingTags, actionValue] }).eq('id', leadId);
                  }
                } else if (actionType === 'remove_tag' && actionValue) {
                  const { data: leadData } = await supabase.from('leads').select('tags').eq('id', leadId).single();
                  const existingTags = leadData?.tags || [];
                  await supabase.from('leads').update({ tags: existingTags.filter((t: string) => t !== actionValue) }).eq('id', leadId);
                } else if (actionType === 'change_status' && actionValue) {
                  await supabase.from('leads').update({ status: actionValue }).eq('id', leadId);
                }
              }
              // ── conditionNode ────────────────────────────────────────────────
              else if (nextNode.type === 'conditionNode') {
                const conditionType = nextNode.data?.conditionType;
                // conditionValue may be in data.conditionValue (from editor) or data.label (legacy)
                const conditionValue = String(nextNode.data?.conditionValue || nextNode.data?.label || '').trim();
                let conditionMet = false;
                
                const { data: leadData } = await supabase.from('leads').select('tags, telefone, status, variaveis').eq('id', leadId).single();
                
                if (conditionType === 'has_tag') {
                  conditionMet = (leadData?.tags || []).includes(conditionValue);
                } else if (conditionType === 'no_tag') {
                  conditionMet = !(leadData?.tags || []).includes(conditionValue);
                } else if (conditionType === 'phone_exists') {
                  conditionMet = !!leadData?.telefone;
                } else if (conditionType === 'match_exact') {
                  // Normalize both sides to handle accents (ex: Informação vs informacao)
                  conditionMet = normalizeText(messageText) === normalizeText(conditionValue);
                } else if (conditionType === 'match_contains') {
                  conditionMet = normalizeText(messageText).includes(normalizeText(conditionValue));
                } else if (conditionType === 'has_status') {
                  conditionMet = normalizeText(leadData?.status || '') === normalizeText(conditionValue);
                } else if (conditionType === 'not_status') {
                  conditionMet = normalizeText(leadData?.status || '') !== normalizeText(conditionValue);
                } else if (conditionType === 'hour_between') {
                  const [start, end] = conditionValue.split('-');
                  if (start && end) {
                    const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
                    const [sH, sM] = start.split(':').map(Number);
                    const [eH, eM] = end.split(':').map(Number);
                    const sT = sH + (sM || 0)/60;
                    const eT = eH + (eM || 0)/60;
                    conditionMet = (currentHour >= sT && currentHour <= eT);
                  }
                } else if (conditionType === 'day_of_week') {
                  const day = new Date().getDay(); // 0-6 (Sun-Sat)
                  conditionMet = (day === Number(conditionValue));
                } else if (conditionType === 'var_equals') {
                  // Format expected: "varName=value"
                  const [vName, vVal] = conditionValue.split('=');
                  if (vName && vVal && leadData?.variaveis) {
                    conditionMet = normalizeText(String(leadData.variaveis[vName.trim()])) === normalizeText(vVal);
                  }
                }
                
                const trueEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('true'));
                const falseEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('false'));
                const targetEdge = conditionMet ? trueEdge : falseEdge;
                console.log(`[webhook] conditionNode [${conditionType}="${conditionValue}"] msg="${messageText}" met=${conditionMet} → ${conditionMet ? 'SIM' : 'NÃO'}`);
                
                nextNode = targetEdge ? currentNodes.find((n: any) => n.id === targetEdge.target) : null;
                continue; // CRITICAL: always continue — do NOT fall through to getNextNode
              }
              // ── delayNode ────────────────────────────────────────────────────
              else if (nextNode.type === 'delayNode') {
                const amount = parseInt(nextNode.data?.amount || '1', 10);
                const unit = nextNode.data?.unit || 'minutos';
                let delayMs = amount * 60 * 1000;
                if (unit === 'segundos') delayMs = amount * 1000;
                else if (unit === 'horas') delayMs = amount * 60 * 60 * 1000;
                else if (unit === 'dias') delayMs = amount * 24 * 60 * 60 * 1000;
                const executeAt = new Date(Date.now() + delayMs).toISOString();
                const edgeAfterDelay = currentEdges.find((e: any) => e.source === nextNode.id);
                if (edgeAfterDelay) {
                  try {
                    await supabase.from('automacoes_pendentes').insert({
                      lead_id: leadId, loja_id: storeId, automacao_id: matchedAuto.id,
                      node_id: edgeAfterDelay.target, execute_at: executeAt
                    });
                    console.log(`[webhook] Delay de ${amount} ${unit}. Fluxo guardado para continuar em ${edgeAfterDelay.target}.`);
                  } catch (e) {
                    console.warn('[webhook] Tabela automacoes_pendentes não encontrada. Delay ignorado.', e);
                  }
                }
                break;
              }
              // ── notifyNode ───────────────────────────────────────────────────
              else if (nextNode.type === 'notifyNode') {
                const alertMsg = nextNode.data?.label || 'Lead precisa de atenção!';
                await supabase.from('leads').update({ precisa_humano: true }).eq('id', leadId);
                await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: `[SISTEMA] [ALERTA] ${alertMsg}`, tipo: 'enviada', is_bot: true, loja_id: storeId });
                console.log(`[webhook] notifyNode: Alerta criado para lead ${leadId}`);
              }
              // ── inputNode ────────────────────────────────────────────────────
              else if (nextNode.type === 'inputNode') {
                const questionRaw = nextNode.data?.label || '';
                if (questionRaw) {
                  const question = await parseVariables(questionRaw, leadId);
                  await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                    body: JSON.stringify({ number: phone, text: question, options: { delay: 1500, presence: 'composing' } }),
                  });
                  await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: question, tipo: 'enviada', is_bot: true, loja_id: storeId });
                  try {
                    await supabase.from('automacoes_pendentes').insert({
                      lead_id: leadId, loja_id: storeId, automacao_id: matchedAuto.id,
                      node_id: nextNode.id, status: 'waiting_input', execute_at: new Date('2099-12-31').toISOString()
                    });
                  } catch (e) {
                    console.warn('[webhook] Não foi possível guardar estado de input:', e);
                  }
                }
                break; // Stop and wait for user's reply
              }
              // ── stopNode ─────────────────────────────────────────────────────
              else if (nextNode.type === 'stopNode') {
                console.log(`[webhook] stopNode atingido. Transferindo para humano.`);
                await supabase.from('leads').update({ controle_conversa: 'humano' }).eq('id', leadId);
                break;
              }
              // ── timerNode ────────────────────────────────────────────────────
              else if (nextNode.type === 'timerNode') {
                const timeStr = nextNode.data?.time || '09:00';
                const [tH, tM] = timeStr.split(':').map(Number);
                let targetDate = new Date();
                targetDate.setHours(tH, tM, 0, 0);
                if (targetDate <= new Date()) targetDate.setDate(targetDate.getDate() + 1);
                const edgeAfterTimer = currentEdges.find((e: any) => e.source === nextNode.id);
                if (edgeAfterTimer) {
                  await supabase.from('automacoes_pendentes').insert({
                    lead_id: leadId, loja_id: storeId, automacao_id: matchedAuto.id,
                    node_id: edgeAfterTimer.target, execute_at: targetDate.toISOString()
                  });
                  console.log(`[webhook] timerNode agendou para ${targetDate.toISOString()}`);
                }
                break;
              }
              // ── randomizerNode ───────────────────────────────────────────────
              else if (nextNode.type === 'randomizerNode') {
                const splitA = parseInt(nextNode.data?.splitA || '50', 10);
                const usePathA = Math.random() * 100 < splitA;
                const edgeA = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).toLowerCase().includes('a'));
                const edgeB = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).toLowerCase().includes('b'));
                const targetEdge = usePathA ? edgeA : edgeB;
                const fallbackEdge = targetEdge || currentEdges.find((e: any) => e.source === nextNode.id);
                console.log(`[webhook] randomizerNode: Caminho ${usePathA ? 'A' : 'B'} selecionado.`);
                nextNode = fallbackEdge ? currentNodes.find((n: any) => n.id === fallbackEdge.target) : null;
                continue;
              }
              // ── webhookNode ──────────────────────────────────────────────────
              else if (nextNode.type === 'webhookNode') {
                const webhookUrl = nextNode.data?.url || '';
                const method = nextNode.data?.method || 'POST';
                if (webhookUrl) {
                  try {
                    const { data: leadPayload } = await supabase.from('leads').select('nome, telefone, tags, status, interesse').eq('id', leadId).single();
                    const payload = { lead_id: leadId, store_id: storeId, phone, last_message: messageText, lead: leadPayload || {}, timestamp: new Date().toISOString() };
                    const res = await fetch(webhookUrl, {
                      method, headers: { 'Content-Type': 'application/json' },
                      body: method === 'POST' ? JSON.stringify(payload) : undefined,
                      signal: AbortSignal.timeout(8000),
                    });
                    console.log(`[webhook] webhookNode: ${method} ${webhookUrl} → ${res.status}`);
                    const successEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('success'));
                    const errorEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('error'));
                    const fallbackEdge = (res.ok ? successEdge : errorEdge) || currentEdges.find((e: any) => e.source === nextNode.id);
                    nextNode = fallbackEdge ? currentNodes.find((n: any) => n.id === fallbackEdge.target) : null;
                    continue;
                  } catch (e) {
                    console.error('[webhook] webhookNode HTTP error:', e);
                    const errorEdge = currentEdges.find((e: any) => e.source === nextNode.id && String(e.sourceHandle).includes('error')) || currentEdges.find((e: any) => e.source === nextNode.id);
                    nextNode = errorEdge ? currentNodes.find((n: any) => n.id === errorEdge.target) : null;
                    continue;
                  }
                }
              }
              // ── jumpNode ─────────────────────────────────────────────────────
              else if (nextNode.type === 'jumpNode') {
                const targetFlowName = String(nextNode.data?.flowName || '').trim().toLowerCase();
                if (targetFlowName) {
                  const { data: targetFlow } = await supabase.from('automacoes').select('*').eq('loja_id', storeId).eq('ativo', true).ilike('nome', `%${targetFlowName}%`).maybeSingle();
                  if (targetFlow && targetFlow.nodes && targetFlow.edges) {
                    const jumpTrigger = targetFlow.nodes.find((n: any) => n.type === 'triggerNode');
                    if (jumpTrigger) {
                      const jumpEdge = targetFlow.edges.find((e: any) => e.source === jumpTrigger.id);
                      if (jumpEdge) {
                        // Swap context to the new flow's nodes/edges
                        currentNodes = targetFlow.nodes;
                        currentEdges = targetFlow.edges;
                        nextNode = currentNodes.find((n: any) => n.id === jumpEdge.target);
                        console.log(`[webhook] jumpNode: Redirecionando para fluxo "${targetFlow.nome}"`);
                        continue;
                      }
                    }
                  } else {
                    console.warn(`[webhook] jumpNode: Fluxo "${targetFlowName}" não encontrado ou inativo.`);
                  }
                }
              }
              
              // Default: advance to next sequential node via edges
              nextNode = getNextNode(nextNode.id, currentNodes, currentEdges);
              await new Promise(r => setTimeout(r, 600)); // Avoid spamming the API
            }
          }
          // --------------------------------------------------------------------------------

          // Só executa escalation se nenhuma automação foi executada
          if (!automationExecuted) {
            if (escalation.reason === 'purchase_intent') {
              await supabase.from('leads').update({ status: 'interessado' }).eq('id', leadId);
            }
            if (escalation.shouldEscalate && escalation.reason) {
              await supabase.from('leads').update({ controle_conversa: 'humano', precisa_humano: true, bot_enabled: false }).eq('id', leadId);
              const transitionMsg = ESCALATION_MESSAGES[escalation.reason] || 'Vou transferir para um atendente :-)';
              await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify({ number: phone, text: transitionMsg, options: { delay: 1500 } }),
              });
              await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: transitionMsg, tipo: 'enviada', is_bot: true, loja_id: storeId });
              if (escalation.reason) await notifyAdminEscalation(supabase, baseUrl, instanceName, EVOLUTION_API_KEY as string, storeId as string, leadName, textForEscalation, escalation.reason);
            }
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, event: 'ignored' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[webhook] Unhandled error:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
