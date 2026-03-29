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
📅 AGENDAMENTO E MARCAÇÕES (CRÍTICO)
* Quando o cliente quiser agendar, reagendar ou cancelar, você DEVE incluir o marcador técnico correspondente NA MESMA RESPOSTA.
* Fale de forma ASSERTIVA e no PRESENTE: "Com certeza! Acabei de registar o seu agendamento para..." ou "Já está! O seu agendamento foi alterado para...".
* NUNCA use frases de hesitação como "Vou verificar", "Um momento", "Aguarde um instante" ou "Vou tentar marcar".
* Confirme sempre o DIA e a HORA na sua resposta textual para o cliente.
* Marcadores: [AGENDAR:servico|data hora], [REMARCAR_AGENDAMENTO:data hora], [CANCELAR_AGENDAMENTO].
* Use o formato ISO para datas nos marcadores (ex: 2024-05-20T14:30:00).
* Se o cliente for vago (ex: "amanhã à tarde"), peça o horário exato antes de usar o marcador.

---
⚠️ REGRAS CRÍTICAS (TOLERÂNCIA ZERO)
* NUNCA inventar informações. Nunca assumir funcionalidades sem confirmação técnica.
* RIGOR PT-PT: Se o tom for "formal", usa "o senhor/a senhora" ou "vossa". NUNCA uses "tu", "te", "teu" ou "consigo" (se referido ao interlocutor de forma informal).
* SEM HESITAÇÃO: É proibido dizer "Um momento", "Vou verificar", "Vou pedir autorização" ou qualquer frase de espera.
* CONTEXTO ESTRITO: NUNCA invente serviços ou produtos. Se a loja vende sapatos, não sugira manicure. Se houver menção a "manicure" no histórico, é um ERRO da IA — ignore e peça desculpa ao cliente se necessário, focando apenas em sapatos.
* PRIVACIDADE: NUNCA mencione o "código único" ou "ID" da loja nos links ou mensagens para o cliente. Use apenas o nome da loja ou o slug.
* MARCADORES IMEDIATOS: O marcador técnico (ex: [AGENDAR], [REMARCAR_AGENDAMENTO], [ENVIAR_PAGAMENTO]) DEVE ser incluído na MESMA resposta em que confirmas a acção ao cliente. Se disseres que vais agendar, tens de incluir o marcador [AGENDAR:...] no fim dessa mensagem.
* SEM FORMATAÇÃO: NUNCA uses negrito (**), itálico (*), hashtags ou listas numeradas.

---
🤖 MARCADORES TÉCNICOS OBRIGATÓRIOS (NÃO REMOVER)
* [AGENDAR:servico|AAAA-MM-DDTHH:MM] — Novos agendamentos.
* [REMARCAR_AGENDAMENTO:AAAA-MM-DDTHH:MM] — Alterações de data/hora de agendamentos existentes.
* [CANCELAR_AGENDAMENTO] — Desmarcar agendamentos pendentes ou confirmados.
* [ENVIAR_PRODUTO:nome_exacto] — Mostrar foto e detalhes (SÓ sob pedido).
* [ENVIAR_PAGAMENTO] — Sempre que pedirem dados de pagamento ou IBAN.
* [ENVIAR_LOCALIZACAO] — Sempre que pedirem morada ou como chegar.
* [SAIR_BOT] — Se o cliente demonstrar irritação extrema ou pedir expressamente um "humano".

---
🎵 MENSAGENS DE MÍDIA (ÁUDIO/IMAGEM)
* Se receberes [O cliente enviou 🎵 Áudio]: "Lamento, mas de momento não consigo ouvir áudios. Poderia escrever, por favor?" (ou versão descontraída se o tom permitir).
* NUNCA digas "recebeste um áudio" (como se estivesses a falar de fora). Assume que TU és o assistente a falar com o cliente.`;

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
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.tipo === 'recebida' ? 'user' as const : 'assistant' as const,
      content: msg.conteudo,
    }));

    // 4. Get Current Appointment + Busy Slots (Context Enhancement - PHASE 2)
    let leadApptsContext = 'Agendamentos Futuros: Nenhum';
    let busySlotsContext = '';
    
    // Fetch lead data explicitly for context
    const { data: leadData } = await supabase.from('leads').select('*').eq('id', lead_id).single();

    if (store_id) {
      // Get ALL upcoming appointments for this lead
      const { data: leadAppts } = await supabase.from('agendamentos')
        .select('data_hora, servico, status, duracao_min')
        .eq('lead_id', lead_id)
        .eq('loja_id', store_id)
        .gte('data_hora', new Date().toISOString())
        .neq('status', 'cancelado')
        .order('data_hora', { ascending: true });

      if (leadAppts && leadAppts.length > 0) {
        leadApptsContext = '📌 TEUS AGENDAMENTOS FUTUROS:\n' + leadAppts.map((a: any) => {
          const end = new Date(new Date(a.data_hora).getTime() + (a.duracao_min || 60) * 60000);
          return `- ${a.servico}: ${new Date(a.data_hora).toLocaleString('pt-PT')} até ${end.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} [Status: ${a.status.toUpperCase()}]`;
        }).join('\n');
      }

      // Get ALL busy slots for the store (Next 3 days) with Intervals
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 3);
      const { data: busy } = await supabase.from('agendamentos')
        .select('data_hora, duracao_min')
        .eq('loja_id', store_id)
        .gte('data_hora', new Date().toISOString())
        .lte('data_hora', tomorrow.toISOString())
        .in('status', ['pendente', 'confirmado']);

      if (busy && busy.length > 0) {
        busySlotsContext = '\n\n⚠️ AGENDA OCUPADA (NÃO marcar nestes intervalos):\n' + busy.map((b: any) => {
          const start = new Date(b.data_hora);
          const end = new Date(start.getTime() + (b.duracao_min || 60) * 60000);
          return `- ${start.toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} às ${end.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
        }).join('\n');
      }
    }

    // 5. Build AI Persona from Rules
    const langInstruction = LANGUAGE_INSTRUCTIONS[storeIdioma] || LANGUAGE_INSTRUCTIONS['pt-PT'];
    
    // Inject extra context into SYSTEM_PROMPT (Phase 2)
    const dynamicContext = `
---
📌 CONTEXTO DO CLIENTE (MEMÓRIA)
* Nome/Interesse: ${leadData?.nome || 'Cliente'} / ${leadData?.interesse || 'Sem preferências'}
* ${leadApptsContext}
${busySlotsContext}

---
🌟 REGRAS DE OURO (NÃO VIOLAR)
1. CONFLITOS DE INTERVALO: Verifique sobreposições na "AGENDA OCUPADA". Considere duração mínima de 60 min.
2. HORÁRIO DE FECHO: Nunca marque nada que termine após o encerramento da loja.
3. AMBIGUIDADE: Se houver >1 agendamento futuro, pergunte qual deseja alterar.
4. MEMÓRIA: Mantenha e mencione preferências ditas anteriormente.

---
🗓️ REGRAS DE AGENDAMENTO AUTOMÁTICO
Estados: nenhum | pendente | confirmado | cancelado | reagendando

1. REAGENDAR:
   - Template: "O seu agendamento foi alterado para {{nova_data_hora}}. Confirma, por favor?"
   - Marcador: [REMARCAR_AGENDAMENTO:data_hora]

2. CANCELAR:
   - Template: "O seu agendamento de {{data_hora_anterior}} foi cancelado. Deseja marcar outro horário?"
   - Marcador: [CANCELAR_AGENDAMENTO]

3. NOVO:
   - Template: "O seu agendamento para {{data_hora}} foi registado com sucesso."
   - Marcador: [AGENDAR:servico|data_hora]

---
🔁 TRANSFERÊNCIA
Ao transferir ([SAIR_BOT]), use: "Encaminho a sua conversa para um especialista. Todo o histórico e agendamento estão disponíveis para garantir continuidade do atendimento."
`;

    // 6. Build Messages
    const systemContent = storeContext + dynamicContext + `\n\nIDIOMA OBRIGATÓRIO: ${langInstruction}` + productContext + scheduleContext + (chatHistory.length <= 1 ? FIRST_CONTACT_INSTRUCTION : '');

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
