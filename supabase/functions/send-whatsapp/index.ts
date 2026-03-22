const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');
  if (!EVOLUTION_API_KEY) {
    return new Response(JSON.stringify({ error: 'EVOLUTION_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
  if (!EVOLUTION_API_URL) {
    return new Response(JSON.stringify({ error: 'EVOLUTION_API_URL not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { instance, number, text, mediaUrl, mediaType, caption, statusPost } = await req.json();

    if (!instance) {
      return new Response(JSON.stringify({ error: 'Missing required field: instance' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
    const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const headers = {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    };

    let response;

    if (statusPost) {
      // Post to WhatsApp Status/Stories using Evolution API sendStatus endpoint
      const statusBody: Record<string, unknown> = {
        allContacts: true,
      };

      if (mediaUrl) {
        statusBody.type = mediaType || 'image';
        statusBody.content = mediaUrl;
        statusBody.caption = caption || '';
      } else {
        statusBody.type = 'text';
        statusBody.content = text || '';
        statusBody.backgroundColor = '#25D366';
        statusBody.font = 1;
      }

      response = await fetch(`${baseUrl}/message/sendStatus/${instance}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(statusBody),
      });
    } else if (mediaUrl) {
      // Send media message to a contact
      if (!number) {
        return new Response(JSON.stringify({ error: 'Missing required field: number' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      response = await fetch(`${baseUrl}/message/sendMedia/${instance}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          number,
          mediatype: mediaType || 'image',
          media: mediaUrl,
          caption: caption || '',
        }),
      });
    } else {
      // Send text message to a contact
      if (!number || !text) {
        return new Response(JSON.stringify({ error: 'Missing required fields: number, text' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          number,
          text,
        }),
      });
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Evolution API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error sending WhatsApp message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
