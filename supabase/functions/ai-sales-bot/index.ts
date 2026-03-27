import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  'pt-AO': 'Responda em Português de Angola. Use expressões angolanas naturais como "bué", "fixe", "mamá", "kota". Moeda: Kz (Kwanza). Estilo amigável e directo.',
  'pt-BR': 'Responda em Português do Brasil. Use expressões brasileiras naturais como "beleza", "show", "top". Moeda: R$ (Real). Estilo descontraído e simpático.',
  'pt-PT': 'Responda em Português de Portugal. Use expressões portuguesas naturais. Moeda: € (Euro). Estilo educado e profissional.',
  'pt-MZ': 'Responda em Português de Moçambique. Use expressões moçambicanas naturais. Moeda: MT (Metical). Estilo caloroso e acolhedor.',
  'pt-ST': 'Responda em Português de São Tomé e Príncipe. Use expressões santomenses. Moeda: Db (Dobra). Estilo amável e próximo.',
};

const SYSTEM_PROMPT = `És um consultor de atendimento humanizado, especialista em vendas via WhatsApp. O teu tom é 100% humano, caloroso, natural e educado — como um bom amigo que também é expert no negócio.

════════════════════════════════════════════════
🚫 PROIBIÇÃO ABSOLUTA DE FORMATAÇÃO (NUNCA VIOLES)
════════════════════════════════════════════════
NUNCA uses os seguintes elementos nas tuas respostas:
- Asteriscos duplos para negrito: **texto** — PROIBIDO
- Asterisco simples para itálico: *texto* — PROIBIDO
- Listas numeradas (1., 2., 3. com ponto) — PROIBIDO
- Hashes para títulos (#, ##) — PROIBIDO
- Linhas separadoras (---) — PROIBIDO
- Emojis a substituir palavras ou em excesso (máximo 1-2 por mensagem)
- Linguagem robótica como "Claro!", "Entendido!", "Com certeza!", "Perfeitamente!"

Em vez disso, escreve como um ser humano culto escreveria uma mensagem de texto:
✔ Frases naturais e fluidas
✔ Vírgulas e pontos para pausas naturais
✔ Linguagem coloquial mas correcta
✔ Máximo 3-4 frases por resposta

EXEMPLO DO QUE NÃO DEVES FAZER:
"Entendi! Vou te enviar as fotos dos tênis. 😊
1. **Tênis Jordan** - Kz 50.000
2. **Tênis Adidas** - Kz 90.000"

EXEMPLO DO QUE DEVES FAZER:
"Temos sim! O Jordan está a Kz 50.000 e o Adidas a Kz 90.000. Quer que te mostre as fotos de algum em especial? [ENVIAR_PRODUTO:Tênis Jordan]"

════════════════════════════════════════════════
📸 REGRAS DE FOTOS E PRODUTOS
════════════════════════════════════════════════
- Se o cliente PEDIR para ver um produto, quiser saber "como é", ou perguntar por fotos → usa OBRIGATORIAMENTE [ENVIAR_PRODUTO:nome_exacto_do_produto]
- Se o cliente pedir vários produtos → usa [ENVIAR_PRODUTO:nome1] [ENVIAR_PRODUTO:nome2] (máximo 3)
- NUNCA envia fotos de forma espontânea sem o cliente pedir
- Podes mencionar que o produto existe, mas só envias a foto se for pedido

════════════════════════════════════════════════
🚨 AGENDAMENTOS — REGRA ABSOLUTA (NUNCA IGNORES)
════════════════════════════════════════════════
Quando o cliente confirmar data e hora:
1. Diz algo natural como: "Já marquei aqui na agenda." — e inclua na mesma mensagem:
   [AGENDAR:nome_do_servico|AAAA-MM-DDTHH:MM]
2. NÃO digas "Está confirmado" ou "Já agendei" antes do sistema confirmar.
3. O sistema envia a confirmação automática após processar o marcador.
4. Para remarcar: [REMARCAR_AGENDAMENTO:AAAA-MM-DDTHH:MM]
5. Para cancelar: [CANCELAR_AGENDAMENTO]
⚠️ Sem o marcador, o agendamento NÃO é gravado.

════════════════════════════════════════════════
🧠 MEMÓRIA E NOME DO CLIENTE
════════════════════════════════════════════════
- Se o cliente disser o seu nome, extrai-o e inclui o marcador [NOME_CLIENTE:Nome] na resposta.
- Usa sempre o nome do cliente (se conhecido) para personalizar as mensagens.
- Mantém o fio da conversa — se o cliente já mostrou interesse num produto ou serviço, prioriza esse contexto.


1. Entende a intenção antes de agir. Se a mensagem for vaga, faz uma pergunta natural.
2. Só fala do que existe no catálogo. Se não temos, diz educadamente.
3. Persuasão suave: destaca benefícios sem pressionar.
4. Nunca inventas produtos, preços ou serviços.
5. Para localização: [ENVIAR_LOCALIZACAO]
6. Para pagamento: [ENVIAR_PAGAMENTO]`;

const FIRST_CONTACT_INSTRUCTION = `

PRIMEIRO CONTACTO: Saúda de forma calorosa e natural. Apresenta-te e pergunta como podes ajudar. Não envies produtos agora, a menos que o cliente já tenha perguntado algo específico.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  // Prioritize direct OpenAI for better reliability
  const useGateway = !OPENAI_API_KEY && !!LOVABLE_API_KEY;
  const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No AI API key configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { lead_id, store_id, message_text, image_url } = await req.json();

    if (!lead_id || (!message_text && !image_url)) {
      return new Response(JSON.stringify({ error: 'Missing lead_id or message_text/image_url' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get store products
    let productContext = '';
    let allProducts: any[] = [];
    if (store_id) {
      try {
        // Try RAG approach first (Vector Search)
        const embedResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: message_text || 'Olá, que produtos tem?',
            model: 'text-embedding-3-small',
          }),
        });
        
        if (embedResponse.ok) {
           const embedResult = await embedResponse.json();
           const query_embedding = embedResult.data[0].embedding;

           const { data: ragProducts, error: rpcError } = await supabase.rpc('match_produtos', {
             query_embedding,
             match_threshold: 0.3,
             match_count: 5,
             p_loja_id: store_id
           });

           if (!rpcError && ragProducts !== null && ragProducts.length > 0) {
             console.log('RAG returned', ragProducts.length, 'products');
             allProducts = ragProducts;
           } else {
             // If RAG returns zero products (maybe no embeddings yet), trigger fallback
             throw new Error('RAG_NO_RESULTS_OR_ERROR');
           }
        } else {
          throw new Error('Embedding API failed');
        }
      } catch (e: any) {
        console.log('Fallback Ativo - buscando catálogo tradicional:', e.message);
        // Fallback to old method (Full Catalogue) - Include out of stock for intelligence
        const { data: products } = await supabase
          .from('produtos')
          .select('nome, preco, descricao, estoque, imagem')
          .eq('loja_id', store_id)
          .limit(20);
        allProducts = products || [];
      }
      if (allProducts.length > 0) {
        productContext = '\n\nCATÁLOGO DE PRODUTOS DA LOJA:\n' +
          allProducts.map((p: any) => {
            const hasStock = (p.estoque ?? 1) > 0;
            const stock = hasStock ? 'Disponível' : 'Esgotado';
            const price = p.formatted_preco || p.preco;
            const variations = p.variations?.length > 0
              ? ` | Variações: ${p.variations.map((v: any) => `${v.nome} (${v.tipo})`).join(', ')}`
              : '';
            return `- ${p.nome} | Kz ${price} | ${stock}${p.descricao ? ' | ' + p.descricao : ''}${variations}`;
          }).join('\n');
        productContext += '\n\nINSTRUÇÕES DE FOTO:';
        productContext += '\n- Se o cliente PEDIR para ver, perguntar "como é" ou quiser detalhes visuais → usa [ENVIAR_PRODUTO:nome_exacto]';
        productContext += '\n- Se pedir múltiplos → [ENVIAR_PRODUTO:nome1] [ENVIAR_PRODUTO:nome2] (máx. 3)';
        productContext += '\n- Usa os Detalhes/Variações para responder sobre tamanhos, cores, especificações.';
        productContext += '\n- NUNCA envias fotos sem o cliente pedir.';
      } else {
        productContext = '\n\nATENÇÃO: Não existem produtos cadastrados nesta loja. Informa o cliente educadamente e oferece alternativas ou contacto humano.';
      }
    }

    // 2. Get store config + idioma
    let storeContext = '';
    let storeIdioma = 'pt-AO';
    let scheduleContext = '';
    if (store_id) {
      const { data: config } = await supabase
        .from('lojas')
        .select('nome, mensagem_boas_vindas, linguagem_bot, formas_pagamento, zonas_entrega, idioma, tipo_negocio, iban, conta_nome, localizacao_url')
        .eq('id', store_id)
        .maybeSingle();

      if (config) {
        storeIdioma = config.idioma || 'pt-AO';
        const businessType = config.tipo_negocio || 'Geral';
        storeContext = `\n\nINFORMAÇÕES DO NEGÓCIO (${businessType.toUpperCase()}):
- Nome: ${config.nome || 'Empresa'}
- Especialidade: ${businessType}
- Formas de pagamento: ${config.formas_pagamento?.join(', ') || 'A definir'}
- IBAN/Dados: ${config.iban || 'Solicitar ao humano'} (${config.conta_nome || ''})
- Localização: ${config.localizacao_url || 'Disponível via marcador'}
- Zonas de entrega: ${config.zonas_entrega?.join(', ') || 'A definir'}`;
        if (config.linguagem_bot) storeContext += `\n- Tom Desejado: ${config.linguagem_bot}`;
      }

      // Get business schedule + compute free slots for next 7 days
      const { data: horarios } = await supabase
        .from('horarios_loja')
        .select('dia_semana, hora_inicio, hora_fim, ativo')
        .eq('loja_id', store_id);

      if (horarios && horarios.length > 0) {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const activeHorarios = horarios.filter((h: any) => h.ativo);
        const now = new Date();

        if (activeHorarios.length > 0) {
          // Fetch existing appointments for next 7 days to compute conflicts
          const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          const { data: existingBookings } = await supabase
            .from('agendamentos')
            .select('data_hora, duracao_min, status')
            .eq('loja_id', store_id)
            .neq('status', 'cancelado')
            .gte('data_hora', now.toISOString())
            .lte('data_hora', nextWeek.toISOString());

          const bookedRanges = (existingBookings || []).map((b: any) => {
            const start = new Date(b.data_hora).getTime();
            return { start, end: start + (b.duracao_min || 60) * 60000 };
          });

          // Compute free slots for next 7 days (1h slots)
          const freeSlots: string[] = [];
          for (let d = 0; d < 7 && freeSlots.length < 15; d++) {
            const day = new Date(now);
            day.setDate(day.getDate() + d);
            const dayOfWeek = day.getDay();
            const schedule = activeHorarios.find((h: any) => h.dia_semana === dayOfWeek);
            if (!schedule) continue;

            const [startH, startM] = schedule.hora_inicio.split(':').map(Number);
            const [endH, endM] = schedule.hora_fim.split(':').map(Number);
            const openTime = startH * 60 + startM;
            const closeTime = endH * 60 + endM;

            for (let slot = openTime; slot + 60 <= closeTime && freeSlots.length < 15; slot += 60) {
              const slotDate = new Date(day);
              slotDate.setHours(Math.floor(slot / 60), slot % 60, 0, 0);

              // Skip past times
              if (slotDate <= now) continue;

              const slotStart = slotDate.getTime();
              const slotEnd = slotStart + 60 * 60000;

              const hasConflict = bookedRanges.some(r => slotStart < r.end && slotEnd > r.start);
              if (!hasConflict) {
                const label = `${dias[dayOfWeek]} ${slotDate.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} às ${String(Math.floor(slot/60)).padStart(2,'0')}:${String(slot%60).padStart(2,'0')}`;
                freeSlots.push(`${label} → [AGENDAR:SERVICO|${slotDate.getFullYear()}-${String(slotDate.getMonth()+1).padStart(2,'0')}-${String(slotDate.getDate()).padStart(2,'0')}T${String(Math.floor(slot/60)).padStart(2,'0')}:${String(slot%60).padStart(2,'0')}]`);
              }
            }
          }

          const horariosLoja = activeHorarios.map((h: any) => `- ${dias[h.dia_semana]}: ${h.hora_inicio} — ${h.hora_fim}`).join('\n');

          scheduleContext = `\n\nHORÁRIOS DE FUNCIONAMENTO:\n${horariosLoja}`;

          if (freeSlots.length > 0) {
            scheduleContext += `\n\nSLOTS DISPONÍVEIS (próximos horários livres):\n${freeSlots.slice(0, 10).join('\n')}`;
            scheduleContext += '\n(Substitua "SERVICO" pelo serviço real pretendido pelo cliente)';
          } else {
            scheduleContext += '\n\nATENÇÃO: Não há horários livres nos próximos 7 dias. Informe o cliente educadamente.';
          }

          scheduleContext += '\n\n🚨 REGRAS CRÍTICAS DE AGENDAMENTO 🚨';
          scheduleContext += '\n1. NUNCA aceite um horário fora do funcionamento (ex: 14:00 se a loja fecha às 13:00).';
          scheduleContext += '\n2. Se o cliente pedir um horário ocupado ou fora do horário, diga educadamente e sugira os SLOTS DISPONÍVEIS listados acima.';
          scheduleContext += '\n3. Quando o cliente CONFIRMAR um slot disponível: use [AGENDAR:servico_real|AAAA-MM-DDTHH:MM]';
          scheduleContext += '\n   Exemplo: "Um momento, já marco aqui... 📅 [AGENDAR:Manicure|2026-03-28T10:00]"';
          scheduleContext += '\n4. Se quiser REMARCAR: use [REMARCAR_AGENDAMENTO:AAAA-MM-DDTHH:MM]';
          scheduleContext += '\n   Exemplo: "Claro, já actualizo aqui... 📅 [REMARCAR_AGENDAMENTO:2026-03-29T14:00]"';
          scheduleContext += '\n5. Se quiser CANCELAR: use [CANCELAR_AGENDAMENTO]';
          scheduleContext += '\n⚠️ SEM o marcador, o agendamento NÃO é gravado no sistema.';
        }
      }
    }

    // 3. Get conversation history
    const { data: history } = await supabase
      .from('mensagens')
      .select('conteudo, tipo, created_at, is_bot, respondido_por_nome')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: true })
      .limit(30);

    const chatHistory = (history || []).map(msg => ({
      role: msg.tipo === 'recebida' ? 'user' as const : 'assistant' as const,
      content: msg.tipo === 'enviada' && !msg.is_bot 
        ? `[NOTA DE CONTEXTO: Esta mensagem foi enviada manualmente pelo atendente humano '${msg.respondido_por_nome || 'Nossa equipe'}']\n${msg.conteudo}`
        : msg.conteudo,
    }));

    const isFirstContact = chatHistory.length <= 1;

    // 4. Build messages with language instruction
    const langInstruction = LANGUAGE_INSTRUCTIONS[storeIdioma] || LANGUAGE_INSTRUCTIONS['pt-AO'];
    const now = new Date();
    // Adjust to Angola/Portugal time if needed (assuming server is UTC, adding +1)
    const localNow = new Date(now.getTime() + (1 * 60 * 60 * 1000));
    const timeContext = `\n\nDATA E HORA ATUAL: ${localNow.toISOString().replace('T', ' ').split('.')[0]} (Use isto para evitar horários passados)`;
    
    let systemContent = SYSTEM_PROMPT + timeContext + `\n\nIDIOMA OBRIGATÓRIO:\n${langInstruction}` + productContext + storeContext + scheduleContext;
    if (isFirstContact) systemContent += FIRST_CONTACT_INSTRUCTION;

    const messages: any[] = [
      { role: 'system', content: systemContent },
      ...chatHistory,
    ];

    // Build user message
    const lastHistoryMsg = chatHistory[chatHistory.length - 1];
    const needsUserMsg = !lastHistoryMsg || lastHistoryMsg.content !== message_text || lastHistoryMsg.role !== 'user';
    
    if (needsUserMsg) {
      if (image_url && useGateway) {
        messages.push({ role: 'user', content: [
          { type: 'image_url', image_url: { url: image_url } },
          { type: 'text', text: message_text || 'O cliente enviou esta imagem. Analise e responda.' },
        ]});
      } else {
        messages.push({ role: 'user', content: message_text || '[O cliente enviou uma mídia]' });
      }
    }

    // 5. Call AI
    const aiUrl = useGateway ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const model = 'gpt-4o-mini';

    console.log(`[ai-bot] Calling AI (${model}) via ${useGateway ? 'Gateway' : 'Direct OpenAI'}. Key length: ${apiKey?.length || 0}`);

    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.3 }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[ai-bot] CRITICAL AI ERROR: Status ${response.status} | Payload: ${errText}`);
      
      if (response.status === 401) throw new Error('Falha de Autenticação na OpenAI (Chave Inválida/Expirada)');
      if (response.status === 429) return new Response(JSON.stringify({ success: false, error: 'Rate limit' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ success: false, error: 'Payment required' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI API error [${response.status}] - ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content?.trim();
    if (!rawReply) {
      console.error('[ai-bot] AI returned success but empty choices:', JSON.stringify(data));
      throw new Error('No reply from AI choices');
    }

    console.log(`[ai-bot] Success! Reply for lead ${lead_id}: "${rawReply.slice(0, 100)}..."`);

    const productsToSend: Array<{ nome: string; preco: number | null; imagem: string }> = [];
    const addedNames = new Set<string>();

    // 6. Parse markers
    const markerRegex = /\[ENVIAR_PRODUTO:([^\]]+)\]/gi;
    const requestedProducts: string[] = [];
    let match;
    while ((match = markerRegex.exec(rawReply)) !== null) requestedProducts.push(match[1].trim());

    const orderMatch = rawReply.match(/\[CRIAR_PEDIDO:([^\]]+)\]/i);
    let orderData: any = null;
    if (orderMatch) {
      const parts = orderMatch[1].split('|').map((s: string) => s.trim());
      if (parts.length >= 5) {
        orderData = { produto: parts[0], valor: parseFloat(parts[1]) || 0, nome_cliente: parts[2], endereco: parts[3], pagamento: parts[4] };
      }
    }

    const scheduleMatch = rawReply.match(/\[AGENDAR:([^\]]+)\]/i);
    const rescheduleMatch = rawReply.match(/\[REMARCAR_AGENDAMENTO:([^\]]+)\]/i);
    const cancelMatch = rawReply.includes('[CANCELAR_AGENDAMENTO]');
    
    let scheduleData: any = null;
    if (scheduleMatch) {
      const parts = scheduleMatch[1].split('|').map((s: string) => s.trim());
      if (parts.length >= 2) {
        scheduleData = { action: 'create', servico: parts[0], data_hora: parts[1] };
      } else if (parts.length === 1) {
        // Fallback: If only one part, assume it is service and look for date in text? 
        // Or assume the whole thing IS the date if it looks like one.
        const isDate = /\d{4}-\d{2}-\d{2}/.test(parts[0]);
        scheduleData = { 
          action: 'create', 
          servico: isDate ? 'Atendimento' : parts[0], 
          data_hora: isDate ? parts[0] : null 
        };
      }
    } else if (rescheduleMatch) {
      scheduleData = { action: 'reschedule', data_hora: rescheduleMatch[1].trim() };
    } else if (cancelMatch) {
      scheduleData = { action: 'cancel' };
    }

    const transferMatch = rawReply.match(/\[TRANSFERIR_HUMANO:([^\]]+)\]/i);
    const escalateToHuman = transferMatch ? transferMatch[1].trim() : null;

    const nameMatch = rawReply.match(/\[NOME_CLIENTE:([^\]]+)\]/i);
    const extractedName = nameMatch ? nameMatch[1].trim() : null;
    if (extractedName && lead_id) {
      console.log(`[ai-bot] Extracted customer name: ${extractedName}`);
      await supabase.from('leads').update({ nome: extractedName }).eq('id', lead_id);
    }

    const paymentMatch = rawReply.includes('[ENVIAR_PAGAMENTO]');
    const locationMatch = rawReply.includes('[ENVIAR_LOCALIZACAO]');

    const cleanReply = rawReply
      .replace(/\s*\[ENVIAR_PRODUTO:[^\]]+\]\s*/gi, ' ')
      .replace(/\s*\[CRIAR_PEDIDO:[^\]]+\]\s*/gi, ' ')
      .replace(/\s*\[TRANSFERIR_HUMANO:[^\]]+\]\s*/gi, ' ')
      .replace(/\s*\[AGENDAR:[^\]]+\]\s*/gi, ' ')
      .replace(/\s*\[REMARCAR_AGENDAMENTO:[^\]]+\]\s*/gi, ' ')
      .replace(/\s*\[CANCELAR_AGENDAMENTO\]\s*/gi, ' ')
      .replace(/\s*\[ENVIAR_PAGAMENTO\]\s*/gi, ' ')
      .replace(/\s*\[ENVIAR_LOCALIZACAO\]\s*/gi, ' ')
      .replace(/\s*\[NOME_CLIENTE:[^\]]+\]\s*/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // ═══════════════════════════════════════════════════════
    // POST-PROCESSOR: Strip ALL markdown formatting
    // Safety net in case the LLM ignores system instructions
    // ═══════════════════════════════════════════════════════
    const humanReply = cleanReply
      // Remove bold (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic (*text* or _text_) — careful not to remove emoji
      .replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '$1')
      .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '$1')
      // Remove markdown headings
      .replace(/^#{1,6}\s+/gm, '')
      // Remove numbered list prefixes like "1. " "2. "
      .replace(/^\d+\.\s+/gm, '')
      // Remove bullet points - but keep natural dashes in context
      .replace(/^[•\-\*]\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-_\*]{3,}\s*$/gm, '')
      // Remove strikethrough
      .replace(/~~([^~]+)~~/g, '$1')
      // Clean up excess newlines (max 2)
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // 6.5 Fallback if AI returned ONLY markers but no text, or just failed
    let finalReply = humanReply;
    if (!finalReply && !productsToSend.length && !orderData && !scheduleData && !paymentMatch && !locationMatch) {
      finalReply = "Como posso ajudar?";
    }

    // 7. Match products
    const addProduct = async (found: any) => {
      if (addedNames.has(found.nome)) return;
      addedNames.add(found.nome);
      let imageUrl = found.imagem;

      if (imageUrl && imageUrl.startsWith('data:')) {
        try {
          const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
            const bytes = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));
            const fileName = `${store_id}/${Date.now()}-${found.nome.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.${ext}`;
            const { error: uploadErr } = await supabase.storage.from('product-images').upload(fileName, bytes, { contentType: `image/${base64Match[1]}`, upsert: true });
            if (!uploadErr) {
              const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                imageUrl = urlData.publicUrl;
                await supabase.from('produtos').update({ imagem: imageUrl }).eq('nome', found.nome).eq('loja_id', store_id);
              }
            }
          }
        } catch (e) { console.error('Base64 migration error:', e); }
      }
      productsToSend.push({ nome: found.nome, preco: found.preco, imagem: imageUrl });
    };

    for (const requested of requestedProducts.slice(0, 3)) {
      const reqLower = requested.toLowerCase();
      const found = allProducts.find(p => {
        const nameLower = p.nome.toLowerCase();
        return nameLower === reqLower || nameLower.includes(reqLower) || reqLower.includes(nameLower);
      });
      if (found) await addProduct(found);
    }

    if (productsToSend.length === 0 && allProducts.length > 0) {
      const replyLower = cleanReply.toLowerCase();
      for (const p of allProducts) {
        if (!p.nome) continue;
        if (p.nome.length >= 3 && replyLower.includes(p.nome.toLowerCase())) {
          await addProduct(p);
          if (productsToSend.length >= 3) break;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reply: cleanReply,
      products_to_send: productsToSend,
      order_data: orderData,
      escalate_to_human: escalateToHuman,
      schedule_data: scheduleData,
      send_payment: paymentMatch,
      send_location: locationMatch,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('AI sales bot error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
