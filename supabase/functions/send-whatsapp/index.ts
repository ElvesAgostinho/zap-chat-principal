const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
  
  if (!EVOLUTION_API_KEY || !EVOLUTION_API_URL) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'EVOLUTION_API_KEY or EVOLUTION_API_URL not configured' 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { instance, number, text, mediaUrl, mediaType, caption, statusPost } = await req.json();

    if (!instance) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required field: instance' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
    const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const headers = { 'Content-Type': 'application/json', 'apikey': EVOLUTION_API_KEY };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    let response;
    try {
      if (statusPost) {
        const statusBody = {
          allContacts: true,
          type: mediaUrl ? (mediaType || 'image') : 'text',
          content: mediaUrl || text || '',
          caption: caption || '',
          backgroundColor: '#25D366',
          font: 1,
        };
        response = await fetch(`${baseUrl}/chat/sendStatus/${instance}`, {
          method: 'POST', headers, body: JSON.stringify(statusBody), signal: controller.signal
        });
      } else if (mediaUrl) {
        if (!number) throw new Error('Missing number for media message');
        response = await fetch(`${baseUrl}/message/sendMedia/${instance}`, {
          method: 'POST', headers, body: JSON.stringify({ number, mediatype: mediaType || 'image', media: mediaUrl, caption: caption || '' }), signal: controller.signal
        });
      } else {
        if (!number || !text) throw new Error('Missing number/text for message');
        response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
          method: 'POST', headers, body: JSON.stringify({ number, text }), signal: controller.signal
        });
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const data = await response.json();
    if (!response.ok) throw new Error(`Evolution API error [${response.status}]: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[send-whatsapp] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.name === 'AbortError' ? 'Timeout: Servidor WhatsApp demorou muito a responder' : error.message 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
