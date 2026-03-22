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

/** Detect media type from message object and return { label, type, mediaObj } */
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

/** Download media from Evolution API and upload to Supabase Storage */
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
    // Try to get the media URL directly from the message object
    const directUrl = mediaObj?.url || mediaObj?.directPath;
    
    // Use Evolution API to get base64 of the media
    const mediaRes = await fetch(`${baseUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
      body: JSON.stringify({ message: { key: { id: messageId } }, convertToMp4: false }),
    });

    if (!mediaRes.ok) {
      console.warn(`[webhook] Failed to fetch media base64: ${mediaRes.status}`);
      // Fallback: try directUrl if available
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

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a',
      'application/pdf': 'pdf',
    };
    const ext = extMap[mimeType] || mimeType.split('/')[1] || 'bin';
    const fileName = `${storeId}/${Date.now()}-${messageId.slice(-8)}.${ext}`;

    // Decode base64 and upload
    const binaryData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const { error: uploadErr } = await supabase.storage
      .from('chat-media')
      .upload(fileName, binaryData, { contentType: mimeType, upsert: true });

    if (uploadErr) {
      console.error('[webhook] Media upload error:', uploadErr);
      return null;
    }

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName);
    console.log(`[webhook] Media persisted: ${urlData?.publicUrl}`);
    return urlData?.publicUrl || null;
  } catch (e) {
    console.error('[webhook] persistMedia error:', e);
    return null;
  }
}

async function fetchProfilePicture(supabase: any, evolutionUrl: string, instanceName: string, apiKey: string, phone: string, leadId: string, logs: string[] = []) {
  try {
    const rawUrl = evolutionUrl.replace(/\/+$/, '');
    const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const fetchUrl = `${baseUrl}/chat/fetchProfilePictureUrl/${instanceName}`;
    
    logs.push(`[webhook] Fetching profile picture for ${phone} from: ${fetchUrl} (POST)`);
    
    const res = await fetch(fetchUrl, {
      method: 'POST',
      headers: { 
        'apikey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ number: phone })
    });
    
    if (res.ok) {
      const data = await res.json();
      logs.push(`[webhook] Evolution API response for ${phone}: ${JSON.stringify(data)}`);
      
      const url = data?.profilePictureUrl || data?.url || data?.data?.profilePictureUrl || data?.data?.url;
      
      if (url && url.startsWith('http')) {
        const { error: updateError } = await supabase.from('leads').update({ foto_url: url }).eq('id', leadId);
        if (updateError) {
          logs.push(`[webhook] Error updating DB for lead ${leadId}: ${JSON.stringify(updateError)}`);
        } else {
          logs.push(`[webhook] Profile picture updated for lead ${leadId}: ${url}`);
        }
        return url;
      } else {
        logs.push(`[webhook] No valid URL found in response for ${phone}`);
      }
    } else {
      const errorText = await res.text();
      logs.push(`[webhook] Evolution API returned ${res.status} for ${phone}: ${errorText}`);
    }
  } catch (e: any) {
    logs.push(`[webhook] Critical error fetching profile picture for ${phone}: ${e?.message || 'Unknown error'}`);
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

    // ===== BULK SYNC ACTION =====
    if (body.action === 'sync_all_profiles') {
      const logs: string[] = [];
      logs.push("[webhook] Starting bulk sync of profiles...");
      const { data: leads } = await supabase.from('leads').select('id, telefone, loja_id');
      const storeId = body.store_id; // Filter by store if provided
      
      let targetLeads = leads || [];
      if (storeId) targetLeads = targetLeads.filter((l: any) => l.loja_id === storeId);

      logs.push(`[webhook] Target leads: ${targetLeads.length}`);

      const { data: lojas } = await supabase.from('lojas').select('id, instance_name');
      const lojaMap = new Map(lojas?.map(l => [l.id, l.instance_name]));

      let count = 0;
      for (const lead of targetLeads) {
        try {
          const instance = lojaMap.get(lead.loja_id);
          if (instance && lead.telefone && EVOLUTION_API_URL && EVOLUTION_API_KEY) {
            await fetchProfilePicture(supabase, EVOLUTION_API_URL, instance, EVOLUTION_API_KEY, lead.telefone.replace(/\D/g, ''), lead.id, logs);
            count++;
          } else {
            logs.push(`[webhook] Skipping lead ${lead.id}: Missing instance=${!!instance}, phone=${!!lead.telefone}, url=${!!EVOLUTION_API_URL}, key=${!!EVOLUTION_API_KEY}`);
          }
        } catch (innerError: any) {
          logs.push(`[webhook] Error syncing lead ${lead.id}: ${innerError?.message || 'Unknown error'}`);
        }
      }
      logs.push(`[webhook] Bulk sync complete. Updated ${count} leads.`);
      return new Response(JSON.stringify({ ok: true, processed: count, logs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawEvent = body.event || body.eventType || body.type || '';
    const eventNormalized = rawEvent.toLowerCase().replace(/_/g, '.');

    console.log(`[webhook] event=${rawEvent} normalized=${eventNormalized} instance=${body.instance || 'unknown'} payload=${JSON.stringify(body).slice(0, 800)}`);

    // ===== HANDLE MESSAGES =====
    if (eventNormalized === 'messages.upsert') {
      const data = body.data || body;
      const instance = body.instance || body.instanceName || body.instance_name || 'Whats';

      if (!data) {
        return new Response(JSON.stringify({ ok: true, skipped: 'no data' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const key = data.key;
      const fromMe = key?.fromMe || false;
      const remoteJid = key?.remoteJid || '';
      const messageId = key?.id || '';

      if (!remoteJid || remoteJid.endsWith('@g.us') || remoteJid.includes('@lid') || remoteJid.includes('status@broadcast') || !remoteJid.endsWith('@s.whatsapp.net')) {
        console.log(`[webhook] skipping non-personal JID: ${remoteJid}`);
        return new Response(JSON.stringify({ ok: true, skipped: 'non_personal_jid' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const phone = remoteJid.replace('@s.whatsapp.net', '');

      const senderJid = body.sender || '';
      const instancePhone = senderJid.replace('@s.whatsapp.net', '');
      if (instancePhone && phone === instancePhone) {
        console.log(`[webhook] Ignoring self-message from instance number ${phone}`);
        return new Response(JSON.stringify({ ok: true, skipped: 'self_instance' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const pushName = data.pushName || data.notifyName || body.pushName || body.notifyName || '';

      // Extract message text and media
      const messageObj = data.message || data.msg || {};
      const messageText =
        messageObj?.conversation ||
        messageObj?.extendedTextMessage?.text ||
        messageObj?.imageMessage?.caption ||
        messageObj?.videoMessage?.caption ||
        messageObj?.documentMessage?.caption ||
        '';

      const media = extractMedia(messageObj);
      const mediaLabel = media?.label || null;
      const contentToSave = messageText || (mediaLabel ? `[${mediaLabel}]` : '[Mídia]');

      // Find store by instance_name
      let storeId: string | null = null;
      const instanceName = String(instance);

      const { data: storeRow } = await supabase
        .from('lojas')
        .select('id')
        .eq('instance_name', instanceName)
        .maybeSingle();

      if (storeRow) {
        storeId = storeRow.id;
      } else {
        console.warn(`⚠️ Instance '${instanceName}' not found in lojas. Falling back to first store.`);
        const { data: firstStore } = await supabase
          .from('lojas')
          .select('id')
          .limit(1)
          .maybeSingle();
        storeId = firstStore?.id || null;
      }

      if (!storeId) {
        console.error('[webhook] No store found, cannot save message');
        return new Response(JSON.stringify({ ok: false, error: 'no_store' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Persist media to Supabase Storage if present
      let persistedMediaUrl: string | null = null;
      let persistedMediaType: string | null = media?.type || null;
      const rawUrl = EVOLUTION_API_URL ? EVOLUTION_API_URL.replace(/\/+$/, '') : '';
      const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

      if (media && media.mediaObj && EVOLUTION_API_KEY && EVOLUTION_API_URL && messageId) {
        persistedMediaUrl = await persistMedia(
          supabase, baseUrl, instanceName, EVOLUTION_API_KEY,
          messageId, media.type, storeId, media.mediaObj,
        );
      }

      // Find or create lead
      let leadId: string | null = null;
      let leadName = pushName || phone;
      let leadControle: string = 'bot';

      if (!fromMe) {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, nome, controle_conversa, bot_enabled')
          .eq('telefone', phone)
          .eq('loja_id', storeId)
          .maybeSingle();

        if (existingLead) {
          leadId = existingLead.id;
          leadName = existingLead.nome || pushName || phone;
          leadControle = existingLead.controle_conversa || 'bot';

          const updateFields: any = { followup_count: 0, ultimo_followup: null };
          if (pushName && pushName !== phone && (!existingLead.nome || existingLead.nome === phone || /^\+?\d[\d\s\-()]+$/.test(existingLead.nome))) {
            updateFields.nome = pushName;
            leadName = pushName;
          }
          await supabase.from('leads').update(updateFields).eq('id', existingLead.id);
        } else {
          const { data: newLead } = await supabase
            .from('leads')
            .insert({
              nome: pushName || phone,
              telefone: phone,
              fonte: 'whatsapp',
              loja_id: storeId,
              interesse: messageText || 'Primeiro contacto',
              status: 'novo',
              bot_enabled: true,
              controle_conversa: 'bot',
              precisa_humano: false,
              tags: ['novo'],
            })
            .select('id')
            .single();

          if (newLead) {
            leadId = newLead.id;
            leadControle = 'bot';
            console.log(`[webhook] New lead created for ${pushName || phone}`);
            // Fetch profile picture for new lead
            if (baseUrl && EVOLUTION_API_KEY) {
              fetchProfilePicture(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, phone, newLead.id);
            }
          }
        }
      } else {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, nome')
          .eq('telefone', phone)
          .eq('loja_id', storeId)
          .maybeSingle();

        if (existingLead) {
          leadId = existingLead.id;
          leadName = existingLead.nome || phone;
        }
      }

      // Save message with media columns
      const msgInsert: any = {
        lead_id: leadId,
        lead_nome: leadName,
        conteudo: contentToSave,
        tipo: fromMe ? 'enviada' : 'recebida',
        is_bot: false,
        loja_id: storeId,
      };
      if (persistedMediaUrl) {
        msgInsert.media_url = persistedMediaUrl;
        msgInsert.media_type = persistedMediaType;
      }

      const { error: msgError } = await supabase.from('mensagens').insert(msgInsert);

      if (msgError) {
        console.error('[webhook] Error saving message:', msgError);
        throw msgError;
      }

      console.log(`[webhook] Message saved: ${fromMe ? 'OUT' : 'IN'} from ${leadName} (${phone}): ${contentToSave.slice(0, 60)}${persistedMediaUrl ? ' [media:' + persistedMediaType + ']' : ''}`);

      // AUTO-REPLY with AI bot (incoming messages with text OR media)
      const hasContent = messageText || media;
      if (!fromMe && hasContent && leadId && storeId && EVOLUTION_API_KEY && EVOLUTION_API_URL) {
        let storeBotActive = true;
        const { data: storeData } = await supabase
          .from('lojas')
          .select('bot_ativo')
          .eq('id', storeId)
          .maybeSingle();
        if (storeData?.bot_ativo === false) storeBotActive = false;

        if (!storeBotActive) {
          console.log(`[webhook] Bot globally disabled for store ${storeId}`);
          return new Response(JSON.stringify({ ok: true, saved: true, bot: 'globally_disabled' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (leadControle === 'humano') {
          console.log(`[webhook] Human mode for lead ${leadId}, skipping bot`);
          return new Response(JSON.stringify({ ok: true, saved: true, bot: 'human_mode' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const textForEscalation = messageText || '';
        const escalation = detectEscalation(textForEscalation);

        if (escalation.reason === 'purchase_intent') {
          await supabase.from('leads').update({ status: 'interessado' }).eq('id', leadId);
        }

        if (escalation.shouldEscalate && escalation.reason) {
          console.log(`[webhook] Escalation (${escalation.reason}) for lead ${leadId}`);
          await supabase.from('leads').update({
            controle_conversa: 'humano',
            precisa_humano: true,
            bot_enabled: false,
          }).eq('id', leadId);

          const transitionMsg = ESCALATION_MESSAGES[escalation.reason] || 'Vou transferir para um atendente 😊';
          await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
            body: JSON.stringify({ number: phone, text: transitionMsg }),
          });

          await supabase.from('mensagens').insert({
            lead_id: leadId, lead_nome: leadName, conteudo: transitionMsg,
            tipo: 'enviada', is_bot: true, loja_id: storeId,
          });

          await notifyAdminEscalation(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, storeId, leadName, textForEscalation, escalation.reason);
        } else {
          // Bot auto-reply — pass image_url if media is an image
          try {
            const botBody: any = { lead_id: leadId, store_id: storeId, message_text: messageText || `[O cliente enviou ${mediaLabel || 'uma mídia'}]` };
            if (persistedMediaUrl && persistedMediaType === 'image') {
              botBody.image_url = persistedMediaUrl;
            }

            const botResponse = await fetch(`${supabaseUrl}/functions/v1/ai-sales-bot`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(botBody),
            });

            const botData = await botResponse.json();

            if (botData.success && botData.reply) {
              const sendResponse = await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                body: JSON.stringify({ number: phone, text: botData.reply }),
              });

              const sendResult = await sendResponse.json();

              if (sendResponse.ok) {
                await supabase.from('mensagens').insert({
                  lead_id: leadId, lead_nome: leadName, conteudo: botData.reply,
                  tipo: 'enviada', is_bot: true, loja_id: storeId,
                });
                console.log(`[webhook] Bot replied to ${leadName}: ${botData.reply.slice(0, 80)}...`);

                // Send product images (max 3)
                const productsToSend = (botData.products_to_send || []).slice(0, 3);
                for (const prod of productsToSend) {
                  if (prod.imagem) {
                    try {
                      let imageUrl = prod.imagem;

                      // If image is base64, upload to Supabase Storage first
                      if (imageUrl.startsWith('data:')) {
                        console.log(`[webhook] Converting base64 image for product "${prod.nome}" to storage URL`);
                        const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
                        if (base64Match) {
                          const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
                          const base64Data = base64Match[2];
                          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                          const fileName = `${storeId}/${Date.now()}-${prod.nome.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.${ext}`;

                          const { error: uploadErr } = await supabase.storage
                            .from('product-images')
                            .upload(fileName, binaryData, {
                              contentType: `image/${base64Match[1]}`,
                              upsert: true,
                            });

                          if (!uploadErr) {
                            const { data: urlData } = supabase.storage
                              .from('product-images')
                              .getPublicUrl(fileName);
                            if (urlData?.publicUrl) {
                              imageUrl = urlData.publicUrl;
                              await supabase.from('produtos')
                                .update({ imagem: imageUrl })
                                .eq('loja_id', storeId)
                                .eq('nome', prod.nome);
                              console.log(`[webhook] Migrated base64 image to storage: ${imageUrl}`);
                            }
                          } else {
                            console.error(`[webhook] Failed to upload base64 image:`, uploadErr);
                          }
                        }
                      }

                      const caption = `${prod.nome} - ${prod.preco ? Number(prod.preco).toLocaleString('pt-AO') + ' Kz' : 'Preço sob consulta'}`;
                      const sendMediaRes = await fetch(`${baseUrl}/message/sendMedia/${instanceName}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                        body: JSON.stringify({ number: phone, mediatype: 'image', media: imageUrl, caption }),
                      });
                      const sendMediaResult = await sendMediaRes.json();
                      console.log(`[webhook] sendMedia result for "${prod.nome}": status=${sendMediaRes.status} ok=${sendMediaRes.ok}`, JSON.stringify(sendMediaResult).slice(0, 200));

                      // Save product image message with media_url
                      await supabase.from('mensagens').insert({
                        lead_id: leadId, lead_nome: leadName,
                        conteudo: `${prod.nome} - ${prod.preco ? Number(prod.preco).toLocaleString('pt-AO') + ' Kz' : 'Preço sob consulta'}`,
                        tipo: 'enviada', is_bot: true, loja_id: storeId,
                        media_url: imageUrl,
                        media_type: 'image',
                      });
                    } catch (imgErr) {
                      console.error(`[webhook] Failed to send product image ${prod.nome}:`, imgErr);
                    }
                  }
                }

                // Auto order creation
                if (botData.order_data) {
                  const od = botData.order_data;
                  try {
                    let produtoImagem: string | null = null;
                    if (storeId) {
                      const { data: prodRow } = await supabase
                        .from('produtos').select('imagem, estoque')
                        .eq('loja_id', storeId).ilike('nome', `%${od.produto}%`).maybeSingle();
                      produtoImagem = prodRow?.imagem || null;
                      // Check stock
                      if (prodRow && (prodRow.estoque || 0) <= 0) {
                        const outOfStockMsg = 'Desculpe, esse produto está esgotado no momento 😔 Posso sugerir outro?';
                        await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                          body: JSON.stringify({ number: phone, text: outOfStockMsg }),
                        });
                        await supabase.from('mensagens').insert({
                          lead_id: leadId, lead_nome: leadName, conteudo: outOfStockMsg,
                          tipo: 'enviada', is_bot: true, loja_id: storeId,
                        });
                        console.log(`[webhook] Product "${od.produto}" out of stock, notified customer`);
                      } else {
                        const { error: vendaError } = await supabase.from('vendas').insert({
                          lead_id: leadId, loja_id: storeId, produto: od.produto,
                          produto_imagem: produtoImagem, valor: od.valor, quantidade: 1,
                          status: 'pendente', pagamento_status: 'pendente', status_entrega: 'pendente',
                          cliente_nome: od.nome_cliente, cliente_telefone: phone,
                          cliente_endereco: od.endereco,
                          observacoes: `Pagamento: ${od.pagamento} | Pedido automático pelo bot`,
                        });
                        if (!vendaError) {
                          console.log(`[webhook] ✅ Order created: ${od.produto} - ${od.nome_cliente}`);
                          // Stock is auto-decremented by trigger
                          try {
                            const { data: loja } = await supabase
                              .from('lojas').select('telefone').eq('id', storeId).maybeSingle();
                            if (loja?.telefone) {
                              const notifText = `🛍️ *Novo pedido!*\n\nProduto: ${od.produto}\nCliente: ${od.nome_cliente}\nValor: ${od.valor?.toLocaleString?.('pt-AO') || od.valor} Kz\nEndereço: ${od.endereco}\nPagamento: ${od.pagamento}`;
                              await fetch(`${baseUrl}/message/sendText/${instanceName}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
                                body: JSON.stringify({ number: loja.telefone, text: notifText }),
                              });
                            }
                          } catch {}
                        }
                      }
                    }
                  } catch (orderErr) {
                    console.error('[webhook] Order creation error:', orderErr);
                  }
                }

                // Auto scheduling
                if (botData.schedule_data && storeId) {
                  const sd = botData.schedule_data;
                  try {
                    await supabase.from('agendamentos').insert({
                      loja_id: storeId, lead_id: leadId,
                      cliente_nome: leadName, cliente_telefone: phone,
                      servico: sd.servico || null,
                      data_hora: sd.data_hora,
                      duracao_min: 60,
                    });
                    console.log(`[webhook] ✅ Appointment created for ${leadName}: ${sd.servico} at ${sd.data_hora}`);
                  } catch (schedErr) {
                    console.error('[webhook] Schedule creation error:', schedErr);
                  }
                }

                if (botData.escalate_to_human) {
                  console.log(`[webhook] AI bot requested human escalation for lead ${leadId}: ${botData.escalate_to_human}`);
                  await supabase.from('leads').update({
                    controle_conversa: 'humano',
                    precisa_humano: true,
                    bot_enabled: false,
                  }).eq('id', leadId);
                  
                  await notifyAdminEscalation(supabase, baseUrl, instanceName, EVOLUTION_API_KEY, storeId, leadName, textForEscalation, botData.escalate_to_human);
                }
              } else {
                console.error('[webhook] Failed to send WhatsApp reply:', JSON.stringify(sendResult));
              }
            } else {
              console.warn('[webhook] AI bot returned no reply:', botData.error);
            }
          } catch (botErr) {
            console.error('[webhook] Bot auto-reply error:', botErr);
          }
        }
      }

      return new Response(JSON.stringify({ ok: true, saved: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== HANDLE CONNECTION UPDATES =====
    if (eventNormalized === 'connection.update') {
      const state = body.data?.state || body.state;
      const instanceName = body.instance || body.instanceName || '';
      console.log(`[webhook] Connection update: ${instanceName} -> ${state}`);

      if (instanceName) {
        const statusMap: Record<string, string> = {
          open: 'connected', close: 'disconnected', connecting: 'connecting',
        };
        await supabase
          .from('lojas')
          .update({ instance_status: statusMap[state] || state })
          .eq('instance_name', instanceName);
      }

      return new Response(JSON.stringify({ ok: true, event: 'connection_update', state }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== LOG UNKNOWN EVENTS =====
    console.log(`[webhook] Unhandled event: ${rawEvent}`);

    return new Response(JSON.stringify({ ok: true, event: rawEvent, handled: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[webhook] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
