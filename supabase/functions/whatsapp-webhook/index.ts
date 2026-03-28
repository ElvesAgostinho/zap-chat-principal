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
  human_request: 'Claro! Vou transferir para um atendente agora mesmo 😊',
  complaint: 'Entendo a sua situação. Vou transferir para um atendente que vai resolver isso para si 🙏',
  low_confidence: 'Deixa-me transferir para um colega que pode explicar melhor 😊',
  irritation: 'Peço desculpa pelo incómodo! Vou transferir para um atendente agora mesmo 🙏',
  negotiation: 'Vou chamar um especialista para te dar as melhores condições 😊',
  urgency: 'Perfeito! Vou transferir para finalizar o pagamento consigo agora mesmo 👌',
  custom_request: 'Entendi! Vou transferir para um especialista que pode ajudar com esse pedido 😊',
};

async function notifyAdminEscalation(
  supabase: any, _baseUrl: string, _instanceName: string, _apiKey: string,
  storeId: string, leadName: string, lastMessage: string, reason: string
) {
  console.log(`[escalation] Lead "${leadName}" needs human attention. Reason: ${reason}. Message: "${lastMessage.slice(0, 100)}". Store: ${storeId}`);
}

function extractMedia(message: any): { label: string; type: string; mediaObj: any } | null {
  if (!message) return null;
  if (message.imageMessage) return { label: '📷 Imagem', type: 'image', mediaObj: message.imageMessage };
  if (message.videoMessage) return { label: '📹 Vídeo', type: 'video', mediaObj: message.videoMessage };
  if (message.audioMessage) return { label: '🎵 Áudio', type: 'audio', mediaObj: message.audioMessage };
  if (message.pttMessage) return { label: '🎵 Áudio', type: 'audio', mediaObj: message.pttMessage };
  if (message.documentMessage) return { label: '📄 Documento', type: 'document', mediaObj: message.documentMessage };
  if (message.stickerMessage) return { label: '🏷️ Sticker', type: 'image', mediaObj: message.stickerMessage };
  if (message.contactMessage || message.contactsArrayMessage) return { label: '👤 Contacto', type: 'document', mediaObj: null };
  if (message.locationMessage || message.liveLocationMessage) return { label: '📍 Localização', type: 'document', mediaObj: null };
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

Deno.serve(async (req) => {
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
      const lojaMap = new Map(lojas?.map(l => [l.id, l.instance_name]));

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

      let persistedMediaUrl: string | null = null;
      let persistedMediaType: string | null = media?.type || null;
      const rawUrlString = EVOLUTION_API_URL ? EVOLUTION_API_URL.replace(/\/+$/, '') : '';
      const baseUrl = rawUrlString.startsWith('http') ? rawUrlString : `https://${rawUrlString}`;

      if (media && media.mediaObj && EVOLUTION_API_KEY && EVOLUTION_API_URL && messageId) {
        persistedMediaUrl = await persistMedia(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, messageId, media.type, storeId, media.mediaObj);
      }

      let leadId: string | null = null;
      let leadName = pushName || phone;
      let leadControle: string = 'bot';

      if (!fromMe) {
        const { data: existingLead } = await supabase.from('leads').select('id, nome, controle_conversa, bot_enabled').eq('telefone', phone).eq('loja_id', storeId).maybeSingle();
        if (existingLead) {
          leadId = existingLead.id;
          leadName = existingLead.nome || pushName || phone;
          leadControle = existingLead.controle_conversa || 'bot';
          await supabase.from('leads').update({ followup_count: 0, ultimo_followup: null }).eq('id', leadId);
        } else {
          const { data: newLead } = await supabase.from('leads').insert({ nome: pushName || phone, telefone: phone, fonte: 'whatsapp', loja_id: storeId, interesse: messageText || 'Primeiro contacto', status: 'novo', bot_enabled: true, controle_conversa: 'bot', precisa_humano: false, tags: ['novo'] }).select('id').single();
          if (newLead) { leadId = newLead.id; leadControle = 'bot'; fetchProfileInfo(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, phone, newLead.id, storeId); }
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
        if (storeData?.bot_ativo !== false && leadControle !== 'humano') {
          const textForEscalation = messageText || '';
          const escalation = detectEscalation(textForEscalation);

          if (escalation.reason === 'purchase_intent') await supabase.from('leads').update({ status: 'interessado' }).eq('id', leadId);

          if (escalation.shouldEscalate && escalation.reason) {
            await supabase.from('leads').update({ controle_conversa: 'humano', precisa_humano: true, bot_enabled: false }).eq('id', leadId);
            const transitionMsg = ESCALATION_MESSAGES[escalation.reason] || 'Vou transferir para um atendente 😊';
            await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
              method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
              body: JSON.stringify({ number: phone, text: transitionMsg }),
            });
            await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: transitionMsg, tipo: 'enviada', is_bot: true, loja_id: storeId });
            await notifyAdminEscalation(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, storeId, leadName, textForEscalation, escalation.reason);
          } else {
            try {
              const botBody: any = { lead_id: leadId, store_id: storeId, message_text: messageText || `[O cliente enviou ${mediaLabel || 'uma mídia'}]` };
              if (persistedMediaUrl && persistedMediaType === 'image') botBody.image_url = persistedMediaUrl;

              const botResponse = await fetch(`${supabaseUrl}/functions/v1/ai-sales-bot`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(botBody),
              });

              if (botResponse.ok) {
                const botData = await botResponse.json();
                if (botData.success && botData.reply) {
                  const sendResponse = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                    body: JSON.stringify({ number: phone, text: botData.reply }),
                  });

                  if (sendResponse.ok) {
                    await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: botData.reply, tipo: 'enviada', is_bot: true, loja_id: storeId });
                    
                    const productsToSend = (botData.products_to_send || []).slice(0, 3);
                    for (const prod of productsToSend) {
                      if (prod.imagem) {
                        try {
                          let imageUrl = prod.imagem;
                          if (imageUrl.startsWith('data:')) {
                            const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
                            if (base64Match) {
                              const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
                              const binaryData = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));
                              const fileName = `${storeId}/${Date.now()}-${prod.nome.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.${ext}`;
                              const { error: uploadErr } = await supabase.storage.from('product-images').upload(fileName, binaryData, { contentType: `image/${base64Match[1]}`, upsert: true });
                              if (!uploadErr) {
                                const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
                                if (urlData?.publicUrl) {
                                  imageUrl = urlData.publicUrl;
                                  await supabase.from('produtos').update({ imagem: imageUrl }).eq('loja_id', storeId).eq('nome', prod.nome);
                                }
                              }
                            }
                          }
                          const caption = `${prod.nome} - ${prod.preco ? Number(prod.preco).toLocaleString('pt-AO') + ' Kz' : 'Preço sob consulta'}`;
                          await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                            body: JSON.stringify({ number: phone, mediatype: 'image', media: imageUrl, caption }),
                          });
                          await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: caption, tipo: 'enviada', is_bot: true, loja_id: storeId, media_url: imageUrl, media_type: 'image' });
                        } catch (imgErr) { console.error(`[webhook] Failed to send product image ${prod.nome}:`, imgErr); }
                      }
                    }

                    if (botData.order_data) {
                      const od = botData.order_data;
                      try {
                        const { data: prodRow } = await supabase.from('produtos').select('imagem, estoque').eq('loja_id', storeId).ilike('nome', `%${od.produto}%`).maybeSingle();
                        if (prodRow && (prodRow.estoque || 0) <= 0) {
                          const osMsg = 'Desculpe, esse produto está esgotado no momento 😔';
                          await fetch(`${baseUrl}/message/sendText/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }, body: JSON.stringify({ number: phone, text: osMsg }) });
                          await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: osMsg, tipo: 'enviada', is_bot: true, loja_id: storeId });
                        } else {
                          const { error: vendaError } = await supabase.from('vendas').insert({ lead_id: leadId, loja_id: storeId, produto: od.produto, produto_imagem: prodRow?.imagem, valor: od.valor, quantidade: 1, status: 'pendente', pagamento_status: 'pendente', status_entrega: 'pendente', cliente_nome: od.nome_cliente, cliente_telefone: phone, cliente_endereco: od.endereco, observacoes: `Pagamento: ${od.pagamento} | Pedido automático pelo bot` });
                          if (!vendaError) {
                            const { data: loja } = await supabase.from('lojas').select('telefone').eq('id', storeId).maybeSingle();
                            if (loja?.telefone) {
                              const notifText = `🛍️ *Novo pedido!*\n\nProduto: ${od.produto}\nCliente: ${od.nome_cliente}\nValor: ${od.valor} Kz\nEndereço: ${od.endereco}\nPagamento: ${od.pagamento}`;
                              await fetch(`${baseUrl}/message/sendText/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }, body: JSON.stringify({ number: loja.telefone, text: notifText }) });
                            }
                          }
                        }
                      } catch (orderErr) { console.error('[webhook] Order creation error:', orderErr); }
                    }

                    if (botData.schedule_data) {
                      const sd = botData.schedule_data;
                      try {
                        if (sd.action === 'create' || sd.action === 'reschedule') {
                           try {
                            const dateToParse = sd.data_hora || new Date().toISOString();
                            const normalizedDate = dateToParse.includes(' ') && !dateToParse.includes('T') ? dateToParse.replace(' ', 'T') : dateToParse;
                            let dateObj = new Date(normalizedDate);
                            if (isNaN(dateObj.getTime())) { dateObj = new Date(); dateObj.setHours(dateObj.getHours() + 1); dateObj.setMinutes(0, 0, 0); }
                            const isoDate = dateObj.toISOString();
                            const targetDate = new Date(isoDate);

                            if (targetDate < new Date()) {
                              const msg = `Lamento, mas não consigo fazer marcações para o passado. Escolhes outro horário? 🕒`;
                              await fetch(`${baseUrl}/message/sendText/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }, body: JSON.stringify({ number: phone, text: msg }) });
                            } else if (sd.action === 'create') {
                              const { error: sErr } = await supabase.from('agendamentos').insert({ lead_id: leadId, loja_id: storeId, data_hora: isoDate, status: 'pendente', cliente_nome: leadName, cliente_whatsapp: phone, servico: sd.servico || 'Atendimento' });
                              if (!sErr) {
                                await supabase.from('notificacoes').insert({ loja_id: storeId, lead_id: leadId, tipo: 'agendamento', titulo: '📅 Novo Agendamento', mensagem: `${leadName} agendou para ${targetDate.toLocaleString('pt-PT')}.`, link: '/schedule' });
                              }
                            } else {
                               const { data: ext } = await supabase.from('agendamentos').select('id, notas').eq('lead_id', leadId).eq('loja_id', storeId).in('status', ['pendente', 'confirmado']).order('data_hora', { ascending: false }).limit(1).maybeSingle();
                               if (ext) await supabase.from('agendamentos').update({ data_hora: isoDate, status: 'pendente', notas: (ext.notas ? ext.notas + '\n' : '') + '🔄 Pedido de reagendamento' }).eq('id', ext.id);
                            }
                          } catch (e) { console.error('[webhook] Date parse error:', e); }
                        } else if (sd.action === 'cancel') {
                          const { error: cErr } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('lead_id', leadId).eq('loja_id', storeId).neq('status', 'concluido');
                          if (!cErr) {
                            const cMsg = `Com certeza, conforme solicitado, o seu agendamento foi cancelado com sucesso. 👋`;
                            await fetch(`${baseUrl}/message/sendText/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }, body: JSON.stringify({ number: phone, text: cMsg }) });
                            await supabase.from('notificacoes').insert({ loja_id: storeId, lead_id: leadId, tipo: 'agendamento', titulo: '🚫 Agendamento Cancelado', mensagem: `${leadName} cancelou o agendamento via bot.`, link: '/schedule' });
                          }
                        }
                      } catch (e) { console.error('[webhook] Schedule error:', e); }
                    }

                    if (botData.send_payment) {
                      const { data: payments } = await supabase.from('formas_pagamento').select('tipo, detalhes').eq('loja_id', storeId).eq('is_active', true);
                      if (payments && payments.length > 0) {
                        const payMsg = `Aqui tens as nossas formas de pagamento:\n\n` + 
                          payments.map(p => `🔹 *${p.tipo}*: ${p.detalhes}`).join('\n') + 
                          `\n\nPor favor, envia o comprovativo após a operação! 🙏`;
                        await fetch(`${baseUrl}/message/sendText/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }, body: JSON.stringify({ number: phone, text: payMsg }) });
                        await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: payMsg, tipo: 'enviada', is_bot: true, loja_id: storeId });
                      }
                    }

                    if (botData.send_location) {
                      const { data: store } = await supabase.from('lojas').select('endereco').eq('id', store_id).maybeSingle();
                      if (store?.endereco) {
                        const locMsg = `📍 *A nossa localização:*\n${store.endereco}\n\nPodes usar a morada acima para chegar até nós! 🚗`;
                        await fetch(`${baseUrl}/message/sendText/${instanceName}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY }, body: JSON.stringify({ number: phone, text: locMsg }) });
                        await supabase.from('mensagens').insert({ lead_id: leadId, lead_nome: leadName, conteudo: locMsg, tipo: 'enviada', is_bot: true, loja_id: storeId });
                      }
                    }

                    if (botData.escalate_to_human) {
                      await supabase.from('leads').update({ controle_conversa: 'humano', precisa_humano: true, bot_enabled: false }).eq('id', leadId);
                      await notifyAdminEscalation(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, storeId, leadName, textForEscalation, botData.escalate_to_human);
                    }
                  }
                }
              }
            } catch (botErr) { console.error('[webhook] Bot error:', botErr); }
          }
        }
      }
    }

    if (eventNormalized === 'connection.update') {
      const state = body.data?.state || body.state;
      const instanceName = body.instance || body.instanceName || '';
      if (instanceName) {
        const updateData: any = { instance_status: state === 'open' ? 'connected' : state === 'close' ? 'disconnected' : 'connecting' };
        const senderJid = body.sender || body.data?.sender || '';
        const instancePhone = senderJid.replace('@s.whatsapp.net', '');
        if (instancePhone) updateData.instance_number = instancePhone;
        await supabase.from('lojas').update(updateData).eq('instance_name', instanceName);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('[webhook] Global error:', error);
    return new Response(JSON.stringify({ ok: false, error: error?.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
