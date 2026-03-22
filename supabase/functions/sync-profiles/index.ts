import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');

  try {
    console.log(`[sync-profiles] Starting... URL=${EVOLUTION_API_URL} KEY_PRESENT=${!!EVOLUTION_API_KEY}`);
    
    if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
      throw new Error(`Missing environment variables: KEY=${!!EVOLUTION_API_KEY}, URL=${!!EVOLUTION_API_URL}`);
    }
    
    // 1. Fetch all leads
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('id, telefone, loja_id, foto_url');

    if (leadError) throw leadError;

    // 2. Group leads by loja_id to fetch instance names efficiently
    const lojaIds = [...new Set(leads.map(l => l.loja_id))];
    const { data: lojas } = await supabase
      .from('lojas')
      .select('id, instance_name')
      .in('id', lojaIds);

    const lojaMap = new Map(lojas?.map(l => [l.id, l.instance_name]));

    let successCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      const instanceName = lojaMap.get(lead.loja_id);
      if (!instanceName || !lead.telefone) {
        console.log(`[sync-profiles] Skipping lead ${lead.id}: No instance or phone.`);
        continue;
      }

      const cleanPhone = lead.telefone.replace(/\D/g, '');
      
      try {
        const fetchUrl = `${EVOLUTION_API_URL}/chat/fetchProfilePictureUrl/${instanceName}?number=${cleanPhone}`;
        console.log(`[sync-profiles] Fetching: ${fetchUrl}`);
        const res = await fetch(fetchUrl, {
          headers: { 'apikey': EVOLUTION_API_KEY! }
        });

        if (res.ok) {
          const data = await res.json();
          const url = data.profilePictureUrl || data.url;
          if (url && url !== lead.foto_url) {
            await supabase.from('leads').update({ foto_url: url }).eq('id', lead.id);
            successCount++;
          }
        } else {
          failCount++;
        }
      } catch (e) {
        console.error(`Error for ${lead.telefone}:`, e);
        failCount++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: leads.length,
      updated: successCount,
      failed: failCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
