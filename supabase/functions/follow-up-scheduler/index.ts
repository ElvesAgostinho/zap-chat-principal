import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FOLLOWUP_MESSAGES = [
  'Olá! 😊 Vi que ficou interessado nos nossos produtos. Posso ajudar com alguma dúvida?',
  'Oi! Ainda está a pensar naquele produto? Posso mostrar mais opções que podem interessar 🛍️',
  'Olá! Só passando para dizer que temos novidades. Se precisar de algo, estou por aqui 👋',
];

const POST_SALE_SATISFACTION = 'Olá! 😊 Esperamos que esteja a gostar da sua compra! Se tiver alguma dúvida ou precisar de algo, estamos por aqui.';

const POST_SALE_PROMO = 'Olá! 🎉 Como cliente especial, temos ofertas exclusivas para si. Quer ver as novidades?';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
    return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
  const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  try {
    // === FOLLOW-UPS NATIVOS (HARD-CODED) DESATIVADOS ======
    // A pedido do usuário, o sistema nativo e incontrolável de follow-ups
    // foi desligado. O CRM dependerá exclusivamente das regras de automação
    // customizáveis (via n8n ou webhooks de campanhas ativas).
    return new Response(JSON.stringify({
      success: true,
      msg: 'Follow-ups natives disabled per user request. Use Automations instead.',
      followups_sent: 0,
      post_sale_sent: 0,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    let followupsSent = 0;
    let postSaleSent = 0;

    // === 1. FOLLOW-UPS for new leads ===
    const now = new Date();

    // Get leads that need follow-up: status 'novo', followup_count < 3, have phone
    const { data: leads } = await supabase
      .from('leads')
      .select('id, nome, telefone, loja_id, followup_count, ultimo_followup, criado_em')
      .in('status', ['novo'])
      .lt('followup_count', 3)
      .not('telefone', 'is', null);

    for (const lead of (leads || [])) {
      const count = lead.followup_count || 0;
      const lastFollowup = lead.ultimo_followup ? new Date(lead.ultimo_followup) : new Date(lead.criado_em);
      const hoursSinceLastAction = (now.getTime() - lastFollowup.getTime()) / (1000 * 60 * 60);

      // Check intervals: 1st at 2h, 2nd at 24h, 3rd at 72h
      const intervals = [2, 24, 72];
      if (hoursSinceLastAction < intervals[count]) continue;

      // Check if lead has responded since last followup (any received message after ultimo_followup)
      const { data: recentMsgs } = await supabase
        .from('mensagens')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('tipo', 'recebida')
        .gt('created_at', lead.ultimo_followup || lead.criado_em)
        .limit(1);

      if (recentMsgs && recentMsgs.length > 0) {
        // Lead responded, stop follow-ups
        continue;
      }

      // Get store instance
      const { data: loja } = await supabase
        .from('lojas')
        .select('instance_name, bot_ativo')
        .eq('id', lead.loja_id)
        .maybeSingle();

      if (!loja?.instance_name || !loja.bot_ativo) continue;

      const msgText = FOLLOWUP_MESSAGES[count] || FOLLOWUP_MESSAGES[0];

      try {
        await fetch(`${baseUrl}/message/sendText/${loja.instance_name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify({ number: lead.telefone, text: msgText }),
        });

        await supabase.from('mensagens').insert({
          lead_id: lead.id,
          lead_nome: lead.nome,
          conteudo: msgText,
          tipo: 'enviada',
          is_bot: true,
          loja_id: lead.loja_id,
        });

        await supabase.from('leads').update({
          followup_count: count + 1,
          ultimo_followup: now.toISOString(),
        }).eq('id', lead.id);

        followupsSent++;
        console.log(`Follow-up #${count + 1} sent to ${lead.nome} (${lead.telefone})`);
      } catch (err) {
        console.error(`Follow-up error for ${lead.nome}:`, err);
      }
    }

    // === 2. POST-SALE: Satisfaction (2-5 days after delivery) ===
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const { data: satisfactionVendas } = await supabase
      .from('vendas')
      .select('id, lead_id, loja_id, cliente_nome, cliente_telefone, data_entregue')
      .eq('status_entrega', 'entregue')
      .not('data_entregue', 'is', null)
      .lte('data_entregue', twoDaysAgo)
      .gte('data_entregue', fiveDaysAgo)
      .not('cliente_telefone', 'is', null);

    for (const venda of (satisfactionVendas || [])) {
      // Check if we already sent satisfaction msg for this sale
      const { data: existing } = await supabase
        .from('mensagens')
        .select('id')
        .eq('loja_id', venda.loja_id)
        .eq('conteudo', POST_SALE_SATISFACTION)
        .eq('lead_id', venda.lead_id)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { data: loja } = await supabase
        .from('lojas')
        .select('instance_name')
        .eq('id', venda.loja_id)
        .maybeSingle();

      if (!loja?.instance_name) continue;

      try {
        await fetch(`${baseUrl}/message/sendText/${loja.instance_name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify({ number: venda.cliente_telefone, text: POST_SALE_SATISFACTION }),
        });

        await supabase.from('mensagens').insert({
          lead_id: venda.lead_id,
          lead_nome: venda.cliente_nome,
          conteudo: POST_SALE_SATISFACTION,
          tipo: 'enviada',
          is_bot: true,
          loja_id: venda.loja_id,
        });

        postSaleSent++;
      } catch (err) {
        console.error(`Satisfaction msg error:`, err);
      }
    }

    // === 3. POST-SALE: Promo (7-15 days after purchase) ===
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();

    const { data: promoVendas } = await supabase
      .from('vendas')
      .select('id, lead_id, loja_id, cliente_nome, cliente_telefone')
      .eq('status', 'concluido')
      .lte('criado_em', sevenDaysAgo)
      .gte('criado_em', fifteenDaysAgo)
      .not('cliente_telefone', 'is', null);

    for (const venda of (promoVendas || [])) {
      const { data: existing } = await supabase
        .from('mensagens')
        .select('id')
        .eq('loja_id', venda.loja_id)
        .eq('conteudo', POST_SALE_PROMO)
        .eq('lead_id', venda.lead_id)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { data: loja } = await supabase
        .from('lojas')
        .select('instance_name')
        .eq('id', venda.loja_id)
        .maybeSingle();

      if (!loja?.instance_name) continue;

      try {
        await fetch(`${baseUrl}/message/sendText/${loja.instance_name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY },
          body: JSON.stringify({ number: venda.cliente_telefone, text: POST_SALE_PROMO }),
        });

        await supabase.from('mensagens').insert({
          lead_id: venda.lead_id,
          lead_nome: venda.cliente_nome,
          conteudo: POST_SALE_PROMO,
          tipo: 'enviada',
          is_bot: true,
          loja_id: venda.loja_id,
        });

        postSaleSent++;
      } catch (err) {
        console.error(`Promo msg error:`, err);
      }
    }

    console.log(`Scheduler done: ${followupsSent} follow-ups, ${postSaleSent} post-sale msgs`);

    return new Response(JSON.stringify({
      success: true,
      followups_sent: followupsSent,
      post_sale_sent: postSaleSent,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Follow-up scheduler error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
