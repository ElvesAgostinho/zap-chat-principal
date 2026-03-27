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

const SYSTEM_PROMPT = `Você é um "Consultor de Atendimento Humanizado" e especialista em conversão gentil via WhatsApp. Seu tom deve ser 100% humano, natural, empático e extremamente educado.

REGRAS DE OURO:
1. COMPORTAMENTO HUMANO: Não pareça um robô. Use pausas naturais na escrita (vírgulas), varie o vocabulário e seja honesto. Se não souber algo, pergunte ou sugira falar com um humano.
2. PERSUASÃO SUTIL: Seja persuasivo destacando os benefícios e a qualidade, mas NUNCA seja agressivo ou insistente demais. O cliente deve se sentir no controle.
3. INTENÇÃO DO CLIENTE: Antes de agir, entenda profundamente o que o cliente deseja. Se a dúvida for vaga, peça gentilmente por mais detalhes.

CONDIÇÕES DE ENVIO (MUITO IMPORTANTE):
- FOTOS E PRODUTOS: NUNCA envie fotos ou o marcador [ENVIAR_PRODUTO:...] de forma espontânea. Você só deve usar esse marcador se o cliente PEDIR para ver o produto, perguntar "como é", quiser detalhes visuais ou demonstrar interesse claro em comprar aquele item específico.
- AGENDAMENTO AUTOMÁTICO: As marcações devem ser automáticas para facilitar o trabalho. Quando o cliente concordar com um horário, use [AGENDAR:servico|data]. Seja proativo ao sugerir horários disponíveis se o cliente mostrar interesse em visitar ou agendar.

REGRAS DE CONSERVAÇÃO:
- LOCALIZAÇÃO: Use [ENVIAR_LOCALIZACAO] se perguntarem onde fica.
- PAGAMENTOS: Use [ENVIAR_PAGAMENTO] se perguntarem como pagar ou quiserem fechar.

ESTRATÉGIA ANTI-BLOQUEIO:
- Varie as saudações: Olá, Tudo bem, Boas, Salve, etc.
- Mensagens curtas e directas.

REGRAS CRÍTICAS DE GROUNDING:
1. SÓ FALE DO QUE EXISTE: Responda APENAS com base nos produtos e horários listados abaixo. Se o cliente pedir algo que não está na lista (ex: "Nike" se não houver Nike na lista de produtos DISPONÍVEIS), diga educadamente que não temos no momento.
2. SEM FALSAS ESPERAS: NUNCA diga que está "procurando", "verificando" ou "aguardando". Dê a resposta final agora com o que você já vê no catálogo.
3. MARCADORES OBRIGATÓRIOS: Ao confirmar agendamento, você DEVE dizer algo como "Um momento enquanto reservo aqui...", "Só um segundo enquanto vejo na agenda..." para parecer humano. O sistema enviará a confirmação definitiva automaticamente, então FOQUE na mensagem de espera e inclua [AGENDAR:servico|YYYY-MM-DDTHH:MM] no final.
4. HORÁRIOS FUTUROS: NUNCA sugira ou aceite horários que já passaram em relação à "DATA E HORA ATUAL" fornecida.`;

const FIRST_CONTACT_INSTRUCTION = `
INSTRUÇÃO ESPECIAL - PRIMEIRO CONTACTO:
Este é o primeiro contacto com este cliente. Comece com uma saudação calorosa e natural. Apresente-se, diga de qual loja você é e pergunte como pode ajudar hoje. NÃO envie produtos agora, a menos que o cliente já tenha perguntado algo específico na primeira mensagem.`;

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
        productContext = '\n\nPRODUTOS DISPONÍVEIS NA LOJA:\n' +
          allProducts.map(p => {
            const hasStock = p.estoque > 0;
            return `- ${p.nome} | Preço: Kz ${p.formatted_preco || p.preco} | Estoque: ${hasStock ? 'Sim' : 'Não'} | Detalhes: ${p.descricao || 'Sem descrição'}`;
          }).join('\n');
        productContext += '\n\nMARCADOR DE FOTO: Use [ENVIAR_PRODUTO:nome_exacto_do_produto] SOMENTE se o cliente pedir para ver o produto ou detalhes visuais.';
        productContext += '\nUse os "Detalhes" para responder perguntas sobre tamanhos, cores ou especificações.';
      } else {
        productContext = '\n\nATENÇÃO: Não existem produtos cadastrados ou em stock nesta loja no momento. Informe o cliente educadamente.';
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

      // Get available schedules for today + next 7 days
      const { data: horarios } = await supabase
        .from('horarios_loja')
        .select('dia_semana, hora_inicio, hora_fim, ativo')
        .eq('loja_id', store_id);

      if (horarios && horarios.length > 0) {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const activeHorarios = horarios.filter((h: any) => h.ativo);
        if (activeHorarios.length > 0) {
          scheduleContext = '\n\nHORÁRIOS DA LOJA:\n' +
            activeHorarios.map((h: any) => `- ${dias[h.dia_semana]}: ${h.hora_inicio} - ${h.hora_fim}`).join('\n');
          scheduleContext += '\n\nSe o cliente quiser agendar, pergunte o serviço e sugira horários disponíveis. Use [AGENDAR:servico|AAAA-MM-DDTHH:MM] quando confirmado.';
          scheduleContext += '\nSe o cliente quiser mudar (remarcar), use [REMARCAR_AGENDAMENTO:AAAA-MM-DDTHH:MM].';
          scheduleContext += '\nSe o cliente quiser cancelar, use [CANCELAR_AGENDAMENTO].';
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
      body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.7 }),
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
      scheduleData = { action: 'create', servico: parts[0], data_hora: parts[1] };
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

    // 6.5 Fallback if AI returned ONLY markers but no text, or just failed
    let finalReply = cleanReply;
    if (!finalReply && !productsToSend.length && !orderData && !scheduleData && !paymentMatch && !locationMatch) {
      finalReply = "Como posso ajudar você hoje?";
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
