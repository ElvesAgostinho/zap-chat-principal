import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();

    // Supabase Webhooks wrap the row in a "record" field
    const record = payload.record;
    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: 'No record found in webhook payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id, nome, descricao, categoria, atributos } = record;
    
    // Combine fields for embedding
    let textToEmbed = `Produto: ${nome || ''}. `;
    if (categoria) textToEmbed += `Categoria: ${categoria}. `;
    if (descricao) textToEmbed += `Descrição: ${descricao}. `;
    if (atributos) {
      const attrsStr = Object.entries(atributos).map(([k, v]) => `${k}: ${v}`).join(', ');
      if (attrsStr) textToEmbed += `Atributos: ${attrsStr}.`;
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('LOVABLE_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'No API Key configured for Embeddings' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call OpenAI Embeddings API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: textToEmbed,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const embedding = result.data[0].embedding;

    // Update the record in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: updateError } = await supabase
      .from('produtos')
      .update({ embedding })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, message: 'Embedding updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
