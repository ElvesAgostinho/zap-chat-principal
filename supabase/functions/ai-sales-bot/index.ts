import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  'pt-AO': 'Responda em Português de Angola. Use expressões angolanas naturais. Moeda: Kz (Kwanza).',
  'pt-BR': 'Responda em Português do Brasil. Moeda: R$ (Real).',
  'pt-PT': 'Responda em Português de Portugal (pt-PT) Profissional. Use "telemóvel" em vez de "celular". NUNCA use o gerúndio brasileiro. Estilo educado e polido.',
  'pt-MZ': 'Responda em Português de Moçambique. Moeda: MT (Metical).',
  'pt-ST': 'Responda em Português de São Tomé e Príncipe. Moeda: Db (Dobra).',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const now = new Date();
  const todayLabel = now.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: '2-digit' });
  const todayISO = now.toISOString().split('T')[0];

  const SYSTEM_PROMPT = `DATA ATUAL: ${todayLabel} (${todayISO}).
És o Assistente Virtual Inteligente do CRM da Loja. Atuas como um funcionário digital altamente profissional, combinando atendimento ao cliente, vendas, agendamento e suporte.

---
🏢 DADOS DA EMPRESA (DINÂMICOS)
* Nome: {{empresa_nome}}
* Tipo de negócio: {{tipo_negocio}}
* Tom de comunicação: {{tom}}
* Idioma: Português de Portugal (pt-PT)
* Endereço: {{endereco}}
* Link Google Maps: {{google_maps}}
* Pagamentos disponíveis: {{pagamentos}}
* Horário de funcionamento: {{horario}}
* Catálogo online: {{catalogo_url}}
* Agendamento disponível: {{tem_agendamento}}
* Uso de agendamento: {{usa_agendamento}}

---
🇵🇹 LINGUAGEM
* Utilizar exclusivamente Português de Portugal (pt-PT). Sê polido, profissional e natural.
* NUNCA use o gerúndio brasileiro (ex: use "estou a ver" em vez de "estou vendo").
* Se o Tom de comunicação for "formal", use "o senhor/a senhora". Se for "descontraído", use "tu".

---
🎯 OBJECTIVO PRINCIPAL
* Converter conversas em vendas. Prestar atendimento de excelência.
* Automatizar processos e guiar o cliente até uma decisão.

---
💰 COMPORTAMENTO DE VENDEDOR PROFISSIONAL
1. Entender a necessidade -> 2. Sugerir solução -> 3. Destacar benefícios -> 4. Eliminar dúvidas -> 5. Conduzir ao fecho.
* PROVA SOCIAL: "Este modelo é bastante procurado."
* ESCASSEZ: "Temos poucas unidades disponíveis."
* UPSELL: Sugerir produtos adicionais de forma natural.

---
📸 ENVIO DE IMAGENS
* SÓ enviar imagens se for estratégico (máximo 1 a 3 com explicação).
* NUNCA enviar sem contexto.

---
📅 AGENDAMENTO (CONTROLO INTELIGENTE)
* Se tem_agendamento = false: Não sugerir marcações.
* Se tipo_negocio = loja: Priorizar venda. (Opcional se solicitado).
* Se tipo_negocio = serviço: Priorizar agendamento.
* AGENDAMENTO IMEDIATO: Se o horário está disponível, usa o marcador [AGENDAR:...] logo na primeira resposta.

---
⚠️ REGRAS CRÍTICAS
* Nunca inventar informações. Nunca assumir funcionalidades sem confirmação.
* SEM HESITAÇÃO: Não digas que vais "verificar". Responde IMEDIATAMENTE ou usa o marcador correspondente.
* SEM FORMATAÇÃO: NUNCA uses negrito (**), itálico (*), hashtags ou listas numeradas.

---
🤖 MARCADORES TÉCNICOS OBRIGATÓRIOS (NÃO REMOVER)
* [AGENDAR:servico|AAAA-MM-DDTHH:MM] — Novos agendamentos.
* [REMARCAR_AGENDAMENTO:AAAA-MM-DDTHH:MM] — Alterações.
* [CANCELAR_AGENDAMENTO] — Desmarcar.
* [ENVIAR_PRODUTO:nome_exacto] — Mostrar foto (SÓ sob pedido).
* [ENVIAR_PAGAMENTO] — Sempre que pedirem dados de pagamento.
* [ENVIAR_LOCALIZACAO] — Sempre que pedirem morada/localização.
* [SAIR_BOT] — Se o cliente pedir suporte humano real.`;

  const FIRST_CONTACT_INSTRUCTION = `\n\nPRIMEIRO CONTACTO: Saúda de forma calorosa e natural. Apresenta-te e pergunta como podes ajudar. Não envies produtos agora, a menos que o cliente já tenha perguntado algo específico.`;

  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const apiKey = OPENAI_API_KEY || LOVABLE_API_KEY;
  const useGateway = !OPENAI_API_KEY && !!LOVABLE_API_KEY;

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
      return new Response(JSON.stringify({ error: 'Missing lead_id or message_text' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get store products Context (RAG + Fallback)
    let productContext = '';
    let allProducts: any[] = [];
    if (store_id) {
      try {
        const embedResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: message_text || 'Olá', model: 'text-embedding-3-small' }),
        });
        
        if (embedResponse.ok) {
          const embedResult = await embedResponse.json();
          const query_embedding = embedResult.data[0].embedding;
          const { data: ragProducts } = await supabase.rpc('match_produtos', {
            query_embedding, match_threshold: 0.3, match_count: 5, p_loja_id: store_id
          });
          if (ragProducts && ragProducts.length > 0) allProducts = ragProducts;
        }
      } catch (e) {
        console.log('RAG Error, falling back to full list:', e);
      }

      if (allProducts.length === 0) {
        const { data: products } = await supabase.from('produtos').select('nome, preco, descricao, estoque, imagem').eq('loja_id', store_id).limit(20);
        allProducts = products || [];
      }

      if (allProducts.length > 0) {
        productContext = '\n\nCATÁLOGO DE PRODUTOS:\n' + allProducts.map(p => `- ${p.nome} | Kz ${p.preco} | ${(p.estoque ?? 1) > 0 ? 'Disponível' : 'Esgotado'}`).join('\n');
      }
    }

    // 2. Get store config + Business Intelligence Context
    let storeContext = '';
    let storeIdioma = 'pt-AO';
    let scheduleContext = '';
    
    if (store_id) {
      const { data: config } = await supabase.from('lojas').select('*').eq('id', store_id).maybeSingle();
      if (config) {
        storeIdioma = config.idioma || 'pt-AO';
        
        const { data: payments } = await supabase.from('formas_pagamento').select('tipo, detalhes').eq('loja_id', store_id).eq('is_active', true);
        const { data: services } = await supabase.from('servicos_loja').select('nome, descricao, duracao_min, preco').eq('loja_id', store_id).eq('ativo', true);
        const { data: horarios } = await supabase.from('horarios_loja').select('dia_semana, hora_inicio, hora_fim, ativo').eq('loja_id', store_id);

        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const horariosText = (horarios || []).filter(h => h.ativo).map(h => `${dias[h.dia_semana]}: ${h.hora_inicio}-${h.hora_fim}`).join(', ');

        let fullPrompt = SYSTEM_PROMPT
          .replace('{{empresa_nome}}', config.nome || 'Nossa Loja')
          .replace('{{tipo_negocio}}', config.tipo_negocio || 'Geral')
          .replace('{{tom}}', config.tom_voz || 'formal')
          .replace('{{endereco}}', config.endereco || 'Solicitar')
          .replace('{{google_maps}}', config.localizacao_url || 'Solicitar')
          .replace('{{catalogo_url}}',  `https://vendazap.ao/${config.slug || config.id}`)
          .replace('{{horario}}', horariosText || 'Consulte o atendente')
          .replace('{{tem_agendamento}}', (services?.length || 0) > 0 ? 'sim' : 'não')
          .replace('{{usa_agendamento}}', config.politica_agendamento || 'opcional')
          .replace('{{pagamentos}}', payments?.length ? payments.map(p => p.tipo).join(', ') : 'A combinar');

        storeContext = `\n\n${fullPrompt}`;
        
        if (services?.length) {
           storeContext += '\n\nSERVIÇOS PARA AGENDAMENTO:\n' + services.map(s => `- ${s.nome} | Kz ${s.preco} | ${s.duracao_min}min`).join('\n');
        }

        // Logic for Free Slots (simplified)
        if (horarios?.length && (services?.length || 0) > 0) {
          scheduleContext = `\n\nINSTRUÇÃO DE AGENDAMENTO: Se o cliente quiser marcar, usa [AGENDAR:servico|DataTime].`;
          // Add some free slots logic if needed (already in database, bot will suggest based on context)
        }
      }
    }

    // 3. Get History
    const { data: history } = await supabase.from('mensagens').select('conteudo, tipo, is_bot').eq('lead_id', lead_id).order('created_at', { ascending: true }).limit(20);
    const chatHistory = (history || []).map(msg => ({
      role: msg.tipo === 'recebida' ? 'user' as const : 'assistant' as const,
      content: msg.conteudo,
    }));

    // 4. Build Messages
    const langInstruction = LANGUAGE_INSTRUCTIONS[storeIdioma] || LANGUAGE_INSTRUCTIONS['pt-AO'];
    const systemContent = storeContext + `\n\nIDIOMA OBRIGATÓRIO: ${langInstruction}` + productContext + scheduleContext + (chatHistory.length <= 1 ? FIRST_CONTACT_INSTRUCTION : '');

    const messages = [
      { role: 'system', content: systemContent },
      ...chatHistory,
      { role: 'user', content: message_text || '[Imagem enviada]' }
    ];

    // 5. Call AI
    const aiUrl = useGateway ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature: 0.3 }),
    });

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content?.trim() || 'Em que posso ajudar?';

    // 6. Clean and Parse
    const cleanReply = rawReply
      .replace(/\[[^\]]+\]/g, (match: string) => match.includes('AGENDAR') || match.includes('ENVIAR') || match.includes('SAIR') || match.includes('CANCELAR') || match.includes('REMARCAR') ? match : '')
      .replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '').trim();

    // Parse markers
    const scheduleMatch = rawReply.match(/\[AGENDAR:([^\]]+)\]/i);
    const rescheduleMatch = rawReply.match(/\[REMARCAR_AGENDAMENTO:([^\]]+)\]/i);
    const cancelMatch = rawReply.includes('[CANCELAR_AGENDAMENTO]');
    const paymentMatch = rawReply.includes('[ENVIAR_PAGAMENTO]');
    const locationMatch = rawReply.includes('[ENVIAR_LOCALIZACAO]');
    const productsMatch = rawReply.match(/\[ENVIAR_PRODUTO:([^\]]+)\]/gi);

    let scheduleInfo: any = null;
    if (scheduleMatch) {
      const parts = scheduleMatch[1].split('|').map((s: string) => s.trim());
      scheduleInfo = { action: 'create', servico: parts[0], data_hora: parts[1] };
    } else if (rescheduleMatch) {
      scheduleInfo = { action: 'reschedule', data_hora: rescheduleMatch[1].trim() };
    } else if (cancelMatch) {
      scheduleInfo = { action: 'cancel' };
    }

    return new Response(JSON.stringify({
      success: true,
      reply: cleanReply.replace(/\[[^\]]+\]/g, '').replace(/\s+/g, ' ').trim(),
      schedule_data: scheduleInfo,
      send_payment: paymentMatch,
      send_location: locationMatch,
      requested_products: productsMatch?.map(m => m.split(':')[1].replace(']','').trim()) || []
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bot Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500, headers: corsHeaders });
  }
});
