import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const parseBody = async (res: Response) => {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');

  if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
    console.error('[whatsapp-connection] Missing configuration');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'EVOLUTION_API_KEY or EVOLUTION_API_URL not configured' 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const rawUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
  const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const apiHeaders = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY };

  const evo = async (path: string, init: RequestInit = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000); // 20s timeout
    try {
      const res = await fetch(`${baseUrl}${path}`, { 
        ...init, 
        headers: { ...apiHeaders, ...(init.headers || {}) },
        signal: controller.signal
      });
      const data = await parseBody(res);
      return { ok: res.ok, status: res.status, data };
    } catch (e: any) {
      const isTimeout = e.name === 'AbortError';
      return { ok: false, status: isTimeout ? 408 : 500, data: { error: isTimeout ? 'Evolution API timeout' : e.message } };
    } finally {
      clearTimeout(id);
    }
  };

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb = createClient(supabaseUrl, supabaseKey);

  const updateInstanceStatus = async (storeId: string | null, instanceName: string, status: string) => {
    if (!storeId) return;
    try {
      await sb.from('lojas').update({ instance_status: status, instance_name: instanceName }).eq('id', storeId);
    } catch (e) {
      console.error('Instance status update failed:', e);
    }
  };

  const extractQr = (payload: any) => ({
    base64: payload?.base64 || payload?.qrcode?.base64 || null,
    pairingCode: payload?.pairingCode || payload?.qrcode?.pairingCode || null,
  });

  const extractList = (payload: any, keys: string[]) => {
    if (Array.isArray(payload)) return payload;
    for (const key of keys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }
    return [] as any[];
  };

  const extractMessageText = (message: any) => {
    if (!message) return '[Mídia]';
    const text = message?.conversation ||
      message?.extendedTextMessage?.text ||
      message?.imageMessage?.caption ||
      message?.videoMessage?.caption ||
      message?.documentMessage?.caption ||
      message?.buttonsResponseMessage?.selectedDisplayText ||
      message?.listResponseMessage?.title ||
      '';
    if (text) return text;
    // Media label fallback
    if (message.imageMessage) return '[📷 Imagem]';
    if (message.videoMessage) return '[📹 Vídeo]';
    if (message.audioMessage || message.pttMessage) return '[🎵 Áudio]';
    if (message.documentMessage) return '[📄 Documento]';
    if (message.stickerMessage) return '[🏷️ Sticker]';
    if (message.contactMessage || message.contactsArrayMessage) return '[👤 Contacto]';
    if (message.locationMessage || message.liveLocationMessage) return '[📍 Localização]';
    return '[Mídia]';
  };

  const parseMessageTimestamp = (raw: any) => {
    const value = typeof raw === 'object'
      ? raw?.low ?? raw?.high ?? raw?.value ?? raw?.seconds
      : raw;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return new Date().toISOString();
    return new Date(numeric > 1_000_000_000_000 ? numeric : numeric * 1000).toISOString();
  };

  const autoSetupWebhook = async (instanceName: string) => {
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    try {
      // Try v2 format with ONLY valid v2 enum events
      const result = await evo(`/webhook/set/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            enabled: true,
            webhookByEvents: false,
            webhookBase64: false,
            events: [
              'MESSAGES_UPSERT',
              'MESSAGES_UPDATE',
              'CONNECTION_UPDATE',
              'CONTACTS_UPDATE',
            ],
          },
        }),
      });
      console.log(`[autoSetupWebhook] instance=${instanceName}, ok=${result.ok}, response=${JSON.stringify(result.data).slice(0, 300)}`);

      // If v2 failed, try v1 format (/webhook)
      if (!result.ok) {
        const resultV1 = await evo(`/webhook/${instanceName}`, {
          method: 'POST',
          body: JSON.stringify({
            url: webhookUrl,
            enabled: true,
            webhookByEvents: false,
            events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
          }),
        });
        console.log(`[autoSetupWebhook] v1 fallback instance=${instanceName}, ok=${resultV1.ok}, response=${JSON.stringify(resultV1.data).slice(0, 300)}`);
      }
    } catch (e) {
      console.error('[autoSetupWebhook] failed:', e);
    }
  };

  const extractChatPreview = (chat: any) => {
    const candidate =
      chat?.lastMessage?.message ||
      chat?.lastMessage ||
      chat?.lastmessage ||
      chat?.lastmsg?.message ||
      chat?.message ||
      null;

    const content = typeof candidate === 'string'
      ? candidate
      : extractMessageText(candidate?.message || candidate);

    const fromMe = Boolean(
      chat?.lastMessage?.key?.fromMe ||
      chat?.lastmessage?.key?.fromMe ||
      chat?.lastmsg?.key?.fromMe ||
      chat?.fromMe
    );

    const createdAt =
      chat?.updatedAt ||
      parseMessageTimestamp(
        chat?.lastMessage?.messageTimestamp ||
        chat?.lastmessage?.messageTimestamp ||
        chat?.lastmsg?.messageTimestamp ||
        chat?.conversationTimestamp ||
        chat?.timestamp
      );

    return {
      conteudo: content || '[Conversa importada do WhatsApp]',
      tipo: fromMe ? 'enviada' : 'recebida',
      created_at: createdAt,
    };
  };

  const ensureLeadForPhone = async (storeId: string, phone: string, fallbackName: string) => {
    const { data: existingLead } = await sb
      .from('leads')
      .select('id, nome')
      .eq('telefone', phone)
      .eq('loja_id', storeId)
      .maybeSingle();

    if (existingLead) {
      // Update name if current name is just a phone number and we have a better name
      if (fallbackName && fallbackName !== phone && (!existingLead.nome || existingLead.nome === phone || /^\+?\d[\d\s\-()]+$/.test(existingLead.nome))) {
        await sb.from('leads').update({ nome: fallbackName }).eq('id', existingLead.id);
        return { id: existingLead.id, name: fallbackName };
      }
      return { id: existingLead.id, name: existingLead.nome || fallbackName };
    }

    const { data: newLead, error: leadError } = await sb
      .from('leads')
      .insert({
        nome: fallbackName,
        telefone: phone,
        fonte: 'whatsapp',
        loja_id: storeId,
        interesse: 'Histórico importado do WhatsApp',
        status: 'novo',
        bot_enabled: true,
        controle_conversa: 'bot',
        precisa_humano: false,
        tags: ['importado'],
      })
      .select('id, nome')
      .single();

    if (leadError || !newLead) {
      console.error('[sync] lead insert failed:', leadError);
      return null;
    }

    return { id: newLead.id, name: newLead.nome || fallbackName };
  };

  const formatPhoneDisplay = (phone: string) => {
    if (phone.startsWith('55') && (phone.length === 13 || phone.length === 12)) {
      const ddd = phone.slice(2, 4);
      const rest = phone.slice(4);
      if (rest.length === 9) return `+55 ${ddd} ${rest.slice(0, 5)}-${rest.slice(5)}`;
      if (rest.length === 8) return `+55 ${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
    if (phone.startsWith('351') && phone.length === 12) {
      return `+351 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    if (phone.startsWith('1') && phone.length === 11) {
      return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
    }
    if (phone.startsWith('54') && (phone.length === 12 || phone.length === 13)) {
      const rest = phone.slice(2);
      const area = rest.slice(0, 2);
      const num = rest.slice(2);
      if (num.length === 8) return `+54 ${area} ${num.slice(0, 4)}-${num.slice(4)}`;
      if (num.length === 9) return `+54 ${area} ${num.slice(0, 5)}-${num.slice(5)}`;
    }
    if (phone.startsWith('44') && phone.length === 12) {
      return `+44 ${phone.slice(2, 6)} ${phone.slice(6)}`;
    }
    if (phone.startsWith('34') && phone.length === 11) {
      return `+34 ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    }
    if (phone.startsWith('33') && phone.length === 11) {
      return `+33 ${phone.slice(2, 3)} ${phone.slice(3, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)} ${phone.slice(9)}`;
    }
    if (phone.startsWith('49') && phone.length >= 12 && phone.length <= 13) {
      return `+49 ${phone.slice(2, 5)} ${phone.slice(5)}`;
    }
    if (phone.startsWith('258') && phone.length === 12) {
      return `+258 ${phone.slice(3, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
    }
    if (phone.startsWith('244') && phone.length === 12) {
      return `+244 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    if (phone.length >= 10) {
      const rest = phone.length > 11 ? phone.slice(3) : phone.length > 10 ? phone.slice(2) : phone.slice(1);
      const cc = phone.slice(0, phone.length - rest.length);
      const chunks: string[] = [];
      for (let i = 0; i < rest.length; i += 3) {
        chunks.push(rest.slice(i, Math.min(i + 3, rest.length)));
      }
      return `+${cc} ${chunks.join(' ')}`;
    }
    return `+${phone}`;
  };

  /** Fetch individual profile as fallback */
  const fetchProfile = async (instanceName: string, number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    try {
      console.log(`[fetchProfile] Attempting for ${cleanNumber} on instance ${instanceName}`);
      const res = await evo(`/chat/fetchProfile/${instanceName}`, { 
        method: 'POST', 
        body: JSON.stringify({ number: cleanNumber }) 
      });
      console.log(`[fetchProfile] Response [${res.status}]:`, JSON.stringify(res.data).slice(0, 200));
      if (res.ok) return res.data?.pushName || res.data?.name || res.data?.verifiedName || res.data?.profile?.pushName || null;
    } catch (e) {
      console.error(`[fetchProfile] Exception for ${cleanNumber}:`, e);
    }
    return null;
  };

  const fetchContacts = async (instanceName: string): Promise<{ map: Map<string, string>, debug: any }> => {
    const contactMap = new Map<string, string>();
    const debug: any = { 
      instance: instanceName,
      attempts: []
    };
    
    const instancesToTry = Array.from(new Set([instanceName, instanceName.toLowerCase()]));
    
    const endpoints = [
      { path: (inst: string) => `/chat/findContacts/${inst}`, method: 'POST', body: { where: {} } },
      { path: (inst: string) => `/chat/getContacts/${inst}`, method: 'GET' }
    ];
 
    for (const inst of instancesToTry) {
        for (const ep of endpoints) {
          try {
            const path = ep.path(inst);
            const res = await evo(path, { 
              method: ep.method, 
              body: ep.body ? JSON.stringify(ep.body) : undefined 
            });
            
            debug.attempts.push({ 
                instance: inst,
                path: path, 
                method: ep.method, 
                status: res.status, 
                ok: res.ok 
            });
 
            if (!res.ok) continue;
 
            const contacts = extractList(res.data, ['data', 'contacts', 'records', 'contacts']);
            debug.attempts[debug.attempts.length - 1].count = contacts.length;
 
            if (contacts.length > 0) {
              for (const c of contacts) {
                const jid = String(c?.id || c?.remoteJid || c?.jid || '');
                if (!jid.endsWith('@s.whatsapp.net')) continue;
                const phone = jid.replace(/@s\.whatsapp\.net$/, '');
                const name = c?.pushName || c?.notify || c?.name || c?.verifiedName || '';
                if (name && name !== phone) {
                  contactMap.set(phone, name);
                }
              }
            }
          } catch (e) {
            console.error(`[fetchContacts] Error:`, e);
          }
        }
        if (contactMap.size > 0) break;
    }
    return { map: contactMap, debug };
  };

  const syncPreviewFromEvolution = async (storeId: string | null, instanceName: string, force = false) => {
    if (!storeId) return { importedMessages: 0, importedLeads: 0, skipped: 'no_store' };

    if (!force) {
      const { count: existingCount } = await sb
        .from('mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('loja_id', storeId);

      if ((existingCount || 0) > 0) {
        return { importedMessages: 0, importedLeads: 0, skipped: 'already_seeded' };
      }
    }

    // Fetch contacts for pushName resolution
    const contactsResult = await fetchContacts(instanceName);
    const contactNames = contactsResult.map;

    const chatsResult = await evo(`/chat/findChats/${instanceName}`, { method: 'POST' });
    console.log(`[syncPreview] findChats [${chatsResult.status}]`);
    if (!chatsResult.ok) {
      return { importedMessages: 0, importedLeads: 0, skipped: 'find_chats_failed', status: chatsResult.status };
    }

    const chats = extractList(chatsResult.data, ['data', 'chats', 'records', 'contacts']);

    // Collect all phone numbers from chats
    const chatPhones = new Set<string>();

    // Get existing leads for dedup
    const { data: existingLeads } = await sb
      .from('leads')
      .select('id, telefone')
      .eq('loja_id', storeId);
    const existingPhones = new Set((existingLeads || []).map((l: any) => l.telefone));

    const previewRows: any[] = [];
    let importedLeads = 0;

    for (const chat of chats) {
      const remoteJid = String(chat?.remoteJid || chat?.id || chat?.jid || chat?.key?.remoteJid || '');
      if (!remoteJid || !remoteJid.endsWith('@s.whatsapp.net')) continue;

      const phone = remoteJid.replace(/@s\.whatsapp\.net$/, '');
      if (!phone || phone === '0' || phone === 'status' || phone.length < 7) continue;

      chatPhones.add(phone);

      // Use pushName from chat, then contacts, then formatted phone
      const pushName = chat?.pushName || chat?.name || chat?.subject || contactNames.get(phone) || '';
      const leadName = pushName || formatPhoneDisplay(phone);

      const lead = await ensureLeadForPhone(storeId, phone, leadName);
      if (!lead) continue;
      if (!existingPhones.has(phone)) importedLeads += 1;

      // Check if we already have a message for this lead (dedup)
      const { count: existingMsgCount } = await sb
        .from('mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('loja_id', storeId);

      if ((existingMsgCount || 0) > 0) continue;

      const preview = extractChatPreview(chat);
      previewRows.push({
        lead_id: lead.id,
        lead_nome: lead.name,
        conteudo: preview.conteudo,
        tipo: preview.tipo,
        is_bot: false,
        loja_id: storeId,
        created_at: preview.created_at,
      });
    }

    // Also import contacts that have pushName but may not have recent chats
    for (const [phone, name] of contactNames.entries()) {
      if (chatPhones.has(phone)) continue; // already handled
      if (phone.length < 7) continue;

      const lead = await ensureLeadForPhone(storeId, phone, name);
      if (!lead) continue;
      if (!existingPhones.has(phone)) importedLeads += 1;
    }

    if (!previewRows.length && importedLeads === 0) {
      return { importedMessages: 0, importedLeads, skipped: 'no_new_previews' };
    }

    if (previewRows.length > 0) {
      const { error: insertError } = await sb.from('mensagens').insert(previewRows);
      if (insertError) {
        console.error('[syncPreview] preview insert failed:', insertError);
        return { importedMessages: 0, importedLeads, skipped: 'preview_insert_failed' };
      }
    }

    console.log(`[syncPreview] imported ${previewRows.length} conversations, ${importedLeads} new leads for ${instanceName}`);
    return { importedMessages: previewRows.length, importedLeads };
  };

  const syncChatHistoryFromEvolution = async (storeId: string | null, instanceName: string, rawPhone: string | null) => {
    if (!storeId || !rawPhone) return { importedMessages: 0, skipped: 'missing_params' };

    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) return { importedMessages: 0, skipped: 'invalid_phone' };

    const lead = await ensureLeadForPhone(storeId, phone, phone);
    if (!lead) return { importedMessages: 0, skipped: 'lead_error' };

    const { data: existingLocal } = await sb
      .from('mensagens')
      .select('conteudo, created_at, tipo')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: true });

    const existingKeys = new Set((existingLocal || []).map((msg: any) => `${msg.tipo}|${msg.created_at}|${msg.conteudo}`));

    const messagesResult = await evo(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ where: { key: { remoteJid: `${phone}@s.whatsapp.net` } } }),
    });

    console.log(`[syncChat] findMessages ${phone} [${messagesResult.status}]`);
    if (!messagesResult.ok) {
      return { importedMessages: 0, skipped: 'find_messages_failed', status: messagesResult.status };
    }

    const messages = extractList(messagesResult.data, ['data', 'messages', 'records']).sort((a: any, b: any) => {
      const aTs = new Date(parseMessageTimestamp(a?.messageTimestamp)).getTime();
      const bTs = new Date(parseMessageTimestamp(b?.messageTimestamp)).getTime();
      return aTs - bTs;
    });

    // Also try to get pushName from messages
    let bestName = lead.name;
    for (const msg of messages) {
      const pn = msg?.pushName || msg?.verifiedBizName || '';
      if (pn && pn !== phone && !msg?.key?.fromMe) {
        bestName = pn;
        break;
      }
    }
    // Update lead name if we found a better one
    if (bestName !== lead.name && bestName !== phone) {
      await sb.from('leads').update({ nome: bestName }).eq('id', lead.id);
    }

    const rows = messages
      .map((message: any) => ({
        lead_id: lead.id,
        lead_nome: bestName,
        conteudo: extractMessageText(message?.message),
        tipo: message?.key?.fromMe ? 'enviada' : 'recebida',
        is_bot: false,
        loja_id: storeId,
        created_at: parseMessageTimestamp(message?.messageTimestamp),
      }))
      .filter((row: any) => !existingKeys.has(`${row.tipo}|${row.created_at}|${row.conteudo}`));

    if (!rows.length) {
      return { importedMessages: 0, skipped: 'already_synced' };
    }

    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      const { error: insertError } = await sb.from('mensagens').insert(chunk);
      if (insertError) {
        console.error('[syncChat] message insert failed:', insertError);
        return { importedMessages: i, skipped: 'message_insert_failed' };
      }
    }

    console.log(`[syncChat] imported ${rows.length} messages for ${phone}`);
    return { importedMessages: rows.length };
  };

  const ensureInstance = async (instanceName: string) => {
    const create = await evo('/instance/create', {
      method: 'POST',
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
    });
    console.log(`ensureInstance create [${create.status}]:`, JSON.stringify(create.data));
    return create;
  };

  const getConnectionState = async (instanceName: string): Promise<string> => {
    const { ok, status, data } = await evo(`/instance/connectionState/${instanceName}`, { method: 'GET' });
    if (!ok) {
      if (status === 404) return 'not_found';
      return 'error';
    }
    const state = data?.instance?.state || data?.state;
    return state || 'unknown';
  };

  try {
    const body = await req.json();
    const { action, instance, store_id } = body;
    const instanceName = instance || 'Whats';
    console.log(`[whatsapp-connection] Action: ${action}, Instance: ${instanceName}, Store: ${store_id}`);

    // ============================================================
    // ACTION: generate_qrcode
    // ============================================================
    if (action === 'generate_qrcode' || action === 'qrcode') {
      console.log(`[generate_qrcode] instance=${instanceName}, store_id=${store_id}`);

      const currentState = await getConnectionState(instanceName);
      console.log(`[generate_qrcode] current state: ${currentState}`);

      if (currentState === 'open' || currentState === 'connected') {
        await updateInstanceStatus(store_id, instanceName, 'connected');
        await autoSetupWebhook(instanceName);
        const sync = await syncPreviewFromEvolution(store_id, instanceName);
        return json({ success: true, status: 'connected', message: 'Instância já está conectada', sync });
      }

      const createResult = await ensureInstance(instanceName);
      const createQr = extractQr(createResult.data);

      if (createQr.base64) {
        await updateInstanceStatus(store_id, instanceName, 'qr_pending');
        return json({ success: true, status: 'qr_ready', data: createQr });
      }
      
      console.log(`[generate_qrcode] ensureInstance no QR, trying connect. CreateRes full: ${JSON.stringify(createResult.data)}`);

      const connect = await evo(`/instance/connect/${instanceName}`, { method: 'GET' });
      console.log(`[generate_qrcode] connect [${connect.status}]:`, JSON.stringify(connect.data).slice(0, 200));

      if (connect.ok) {
        const connectQr = extractQr(connect.data);
        if (connectQr.base64 || connectQr.pairingCode) {
          await updateInstanceStatus(store_id, instanceName, 'qr_pending');
          return json({ success: true, status: 'qr_ready', data: connectQr });
        }
        const state = connect.data?.instance?.state || connect.data?.state;
        if (state === 'open' || state === 'connected') {
          await updateInstanceStatus(store_id, instanceName, 'connected');
          await autoSetupWebhook(instanceName);
          const sync = await syncPreviewFromEvolution(store_id, instanceName);
          return json({ success: true, status: 'connected', message: 'Conectado com sucesso', sync });
        }
      }

      if (connect.status === 404 || !connect.ok) {
        console.log(`[generate_qrcode] connect failed, forcing recreate`);

        try { await evo(`/instance/logout/${instanceName}`, { method: 'DELETE' }); } catch {}
        await sleep(500);
        try { await evo(`/instance/delete/${instanceName}`, { method: 'DELETE' }); } catch {}
        await sleep(1500);

        const recreate = await evo('/instance/create', {
          method: 'POST',
          body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
        });

        const recreateQr = extractQr(recreate.data);
        if (recreateQr.base64) {
          await updateInstanceStatus(store_id, instanceName, 'qr_pending');
          return json({ success: true, status: 'qr_ready', data: recreateQr });
        }

        await sleep(1000);
        const reconnect = await evo(`/instance/connect/${instanceName}`, { method: 'GET' });
        const reconnectQr = extractQr(reconnect.data);

        if (reconnectQr.base64 || reconnectQr.pairingCode) {
          await updateInstanceStatus(store_id, instanceName, 'qr_pending');
          return json({ success: true, status: 'qr_ready', data: reconnectQr });
        }

        return json({ 
          success: false, 
          status: 'error', 
          error: 'Não foi possível gerar QR Code. Tente reiniciar a instância manualmente.',
          details: {
            currentState,
            connect: connect.data,
            reconnect: reconnect.data
          }
        }, 200);
      }

      return json({ 
        success: false, 
        status: 'error', 
        error: 'Estado inesperado da instância na Evolution API.',
        details: { currentState, connect: connect.data }
      }, 200);
    }

    if (action === 'sync_history' || action === 'sync_preview') {
      const sync = await syncPreviewFromEvolution(store_id, instanceName);
      return json({ success: true, status: 'sync_complete', instance: instanceName, sync });
    }

    if (action === 'force_sync') {
      console.log(`[force_sync] Cleaning ALL data and re-syncing for store=${store_id}`);
      
      // Delete ALL messages for this store first
      await sb.from('mensagens').delete().eq('loja_id', store_id);
      console.log(`[force_sync] Deleted all messages for store`);
      
      // Delete ALL leads for this store (they'll be re-created)
      await sb.from('leads').delete().eq('loja_id', store_id);
      console.log(`[force_sync] Deleted all leads for store`);
      
      const sync = await syncPreviewFromEvolution(store_id, instanceName, true);
      return json({ success: true, status: 'force_sync_complete', instance: instanceName, sync });
    }

    if (action === 'sync_names') {
      console.log(`[sync_names] Fetching names from Evolution for store=${store_id}`);
      const contactsResult = await fetchContacts(instanceName);
      const contactNames = contactsResult.map;
      
      const { data: leads, error: leadFetchError } = await sb.from('leads').select('id, telefone, nome').eq('loja_id', store_id);
      
      if (leadFetchError) {
        console.error(`[sync_names] DB Error: ${leadFetchError.message}`);
        return json({ success: false, error: leadFetchError.message, debug: 'Failed to fetch leads from DB.' }, 200);
      }

      let updatedCount = 0;
      const sampleMapping: any[] = [];

      if (leads) {
        console.log(`[sync_names] Iterating over ${leads.length} leads in DB...`);
        const leadMap = new Map((leads || []).map(l => [l.telefone.replace(/\D/g, ''), l]));
        
        // 1. Update from Evolution Contacts List
        console.log(`[sync_names] Phase 1: Contact List Sync (${contactNames.size} contacts found in API)`);
        for (const [phone, name] of contactNames.entries()) {
          const lead = leadMap.get(phone);
          if (lead && name && name !== lead.nome) {
            const isNewNameHuman = /[a-zA-Z]/.test(name) && name.length > 2;
            const isOldNameHuman = /[a-zA-Z]/.test(lead.nome || '') && (lead.nome || '').length > 2;
            
            // Se o nome novo for "humano" e o antigo não for, ou se o novo for diferente, atualizamos.
            if (isNewNameHuman || !isOldNameHuman) {
              console.log(`[sync_names] Updating name for lead ${lead.id}: ${lead.nome} -> ${name}`);
              const { error } = await sb.from('leads').update({ nome: name }).eq('id', lead.id);
              if (!error) {
                updatedCount++;
                lead.nome = name; 
              }
            }
          }
        }

        // 2. RECOVERY: Try to find names in messages history or Deep Fetch for leads still without names
        const leadsToFix = leads.filter(l => !/[a-zA-Z]/.test(l.nome || ''));
        console.log(`[sync_names] Phase 2: Deep Recovery for ${leadsToFix.length} leads without human names...`);
        
        if (leadsToFix.length > 0) {
          for (const lead of leadsToFix) {
            const phone = lead.telefone.replace(/\D/g, '');
            console.log(`[sync_names] Deep recovery for ${phone} (ID: ${lead.id})`);
            
            // 2a. Try Deep Fetch Profile
            const pn = await fetchProfile(instanceName, phone);
            if (pn && /[a-zA-Z]/.test(pn)) {
              console.log(`[sync_names] Profile found for ${phone}: ${pn}`);
              const { error } = await sb.from('leads').update({ nome: pn }).eq('id', lead.id);
              if (!error) {
                updatedCount++;
                continue; // Found it!
              }
            }

            // 2b. Fallback to Message History Metadata
            const { data: msgs } = await sb.from('mensagens')
              .select('metadata')
              .eq('lead_id', lead.id)
              .not('metadata', 'is', null)
              .order('created_at', { ascending: false })
              .limit(5);
            
            if (msgs && msgs.length > 0) {
              for (const m of msgs) {
                const meta = m.metadata as any;
                // Check multiple locations in metadata for pushName
                const foundName = meta?.pushName || meta?.notify || meta?.verifiedName || meta?.instance?.pushName || 
                                 meta?.message?.pushName || meta?.record?.pushName || meta?.data?.pushName;
                
                if (foundName && /[a-zA-Z]/.test(foundName)) {
                  console.log(`[sync_names] Name found in history for ${phone}: ${foundName}`);
                  const { error } = await sb.from('leads').update({ nome: foundName }).eq('id', lead.id);
                  if (!error) {
                    updatedCount++;
                    break;
                  }
                }
              }
            } else {
              console.log(`[sync_names] No message history metadata for ${phone}`);
            }
          }
        }
      }

      return json({ 
        success: true, 
        updated: updatedCount, 
        total_contacts: contactNames.size,
        debug_api: contactsResult.debug,
        debug_sample: sampleMapping,
        message: contactNames.size === 0 ? 'Nenhum contato com nome encontrado na API' : `${updatedCount} nomes sincronizados`
      });
    }


    if (action === 'debug_db') {
      const { data: store } = await sb.from('lojas').select('*').eq('id', store_id).maybeSingle();
      const { count: leadCount } = await sb.from('leads').select('id', { count: 'exact', head: true }).eq('loja_id', store_id);
      return json({ 
        success: true, 
        store, 
        lead_count: leadCount,
        env: {
          has_api_key: !!EVOLUTION_API_KEY,
          has_api_url: !!EVOLUTION_API_URL,
          supabase_url: supabaseUrl
        }
      });
    }

    if (action === 'sync_chat') {
      const sync = await syncChatHistoryFromEvolution(store_id, instanceName, body.phone || null);
      return json({ success: true, status: 'sync_chat_complete', instance: instanceName, sync });
    }

    // ============================================================
    // ACTION: check_connection
    // ============================================================
    if (action === 'check_connection' || action === 'status') {
      const state = await getConnectionState(instanceName);
      console.log(`[check_connection] instance=${instanceName}, state=${state}`);

      let status: string;
      let sync: any = null;
      if (state === 'open' || state === 'connected') {
        status = 'connected';
        await updateInstanceStatus(store_id, instanceName, 'connected');
        await autoSetupWebhook(instanceName);
        sync = await syncPreviewFromEvolution(store_id, instanceName);
      } else if (state === 'not_found') {
        status = 'not_found';
        await updateInstanceStatus(store_id, instanceName, 'disconnected');
      } else if (state === 'connecting') {
        status = 'connecting';
      } else {
        status = 'disconnected';
        await updateInstanceStatus(store_id, instanceName, 'disconnected');
      }

      return json({ success: true, status, state, instance: instanceName, sync });
    }

    // ============================================================
    // ACTION: test_message
    // ============================================================
    if (action === 'test_message') {
      const { phone } = body;
      if (!phone) return json({ success: false, error: 'phone is required for test_message' }, 200);

      const state = await getConnectionState(instanceName);
      if (state !== 'open' && state !== 'connected') {
        return json({ success: false, status: 'not_connected', error: 'Instância não está conectada' });
      }

      const testMsg = `✅ VendaZap - Teste de conexão realizado com sucesso!\n\n📅 ${new Date().toLocaleString('pt-BR')}\n🔗 Instância: ${instanceName}`;
      const send = await evo(`/message/sendText/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number: phone.replace(/\D/g, ''), text: testMsg }),
      });

      if (send.ok) {
        return json({ success: true, status: 'test_sent', message: 'Mensagem de teste enviada com sucesso' });
      }

      const errorDetail = send.data?.response?.message || send.data?.error || 'Falha ao enviar';
      return json({ success: false, status: 'test_failed', error: errorDetail });
    }

    // ============================================================
    // ACTION: logout
    // ============================================================
    if (action === 'logout') {
      const { data } = await evo(`/instance/logout/${instanceName}`, { method: 'DELETE' });
      await updateInstanceStatus(store_id, instanceName, 'disconnected');
      return json({ success: true, data });
    }

    // ============================================================
    // ACTION: restart
    // ============================================================
    if (action === 'restart') {
      console.log(`[restart] instance=${instanceName}`);

      try { await evo(`/instance/logout/${instanceName}`, { method: 'DELETE' }); } catch {}
      await sleep(500);
      try { await evo(`/instance/delete/${instanceName}`, { method: 'DELETE' }); } catch {}
      await sleep(1500);

      const create = await evo('/instance/create', {
        method: 'POST',
        body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
      });

      const createQr = extractQr(create.data);
      if (createQr.base64 || createQr.pairingCode) {
        await updateInstanceStatus(store_id, instanceName, 'qr_pending');
        return json({ success: true, status: 'qr_ready', data: createQr });
      }

      await sleep(1000);
      const connect = await evo(`/instance/connect/${instanceName}`, { method: 'GET' });
      const connectQr = extractQr(connect.data);

      if (connectQr.base64 || connectQr.pairingCode) {
        await updateInstanceStatus(store_id, instanceName, 'qr_pending');
        return json({ success: true, status: 'qr_ready', data: connectQr });
      }

      if (!connect.ok) {
        return json({ success: false, error: `Falha ao reiniciar [${connect.status}]` }, 200);
      }

      return json({ success: true, status: 'restarted', data: connect.data });
    }

    // ============================================================
    // ACTION: setup_webhook
    // ============================================================
    if (action === 'setup_webhook') {
      const webhookUrl = body.webhookUrl;
      if (!webhookUrl) return json({ success: false, error: 'webhookUrl required' }, 200);

      const result = await evo(`/webhook/set/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          webhook: {
            url: webhookUrl,
            enabled: true,
            webhookByEvents: false,
            webhookBase64: false,
            events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE', 'QRCODE_UPDATED',
                     'messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'],
          },
        }),
      });

      return json({ success: result.ok, data: result.data });
    }

    return json({ success: false, error: 'Invalid action. Use: generate_qrcode, check_connection, test_message, logout, restart, setup_webhook, force_sync, sync_chat' }, 200);
  } catch (error: any) {
    console.error('[whatsapp-connection] Global Failure:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || String(error),
      details: 'Check Evolution API logs or connection state.'
    }), { 
      status: 200, // Return 200 so UI can parse the error JSON
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
