import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');

  try {
    const results = [];

    // 1. BLOQUEIO AUTOMÁTICO - Lojas com plano expirado
    const { data: expiredSubs, error: expiredError } = await supabaseAdmin
      .from('assinaturas')
      .select('loja_id, id, data_fim, lojas(nome, status_aprovacao)')
      .eq('status', 'ativo')
      .lt('data_fim', new Date().toISOString());

    if (expiredError) throw expiredError;

    for (const sub of (expiredSubs || [])) {
      if (sub.lojas?.status_aprovacao === 'ativo') {
        // Suspender loja
        await supabaseAdmin
          .from('lojas')
          .update({ status_aprovacao: 'suspenso' })
          .eq('id', sub.loja_id);
        
        results.push(`Loja SUSPENSA: ${sub.lojas.nome}`);
      }
    }

    // 2. LEMBRETES AUTOMÁTICOS - 3 dias antes do fim
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: upcomingSubs, error: upcomingError } = await supabaseAdmin
      .from('assinaturas')
      .select('id, data_fim, loja_id, lojas(nome, telefone, instance_name)')
      .eq('status', 'ativo')
      .lte('data_fim', threeDaysLater.toISOString())
      .gt('data_fim', new Date().toISOString());

    if (upcomingError) throw upcomingError;

    for (const sub of (upcomingSubs || [])) {
      // Verificar se já enviamos lembrete hoje
      const { data: alreadySent } = await supabaseAdmin
        .from('assinaturas')
        .select('ultimo_lembrete_enviado')
        .eq('id', sub.id)
        .eq('ultimo_lembrete_enviado', todayStr)
        .maybeSingle();

      if (!alreadySent && sub.lojas?.telefone && sub.lojas?.instance_name) {
        // Enviar WhatsApp via Evolution API
        const daysLeft = Math.ceil((new Date(sub.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const message = `⚠️ *AVISO CRM TOP*\n\nOlá! A assinatura da sua loja *${sub.lojas.nome}* expira em *${daysLeft} dias*.\n\nPara evitar o bloqueio automático do seu acesso e das suas automações, por favor realize a renovação no seu painel ou contacte o suporte.\n\n_Atenciosamente, Equipa CRM TOP_`;

        try {
          const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${sub.lojas.instance_name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY! },
            body: JSON.stringify({ number: sub.lojas.telefone, text: message })
          });
          
          if (res.ok) {
            await supabaseAdmin
              .from('assinaturas')
              .update({ ultimo_lembrete_enviado: todayStr })
              .eq('id', sub.id);
            results.push(`Lembrete ENVIADO: ${sub.lojas.nome}`);
          }
        } catch (err) {
          console.error(`Erro ao enviar lembrete para ${sub.lojas.nome}:`, err);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
