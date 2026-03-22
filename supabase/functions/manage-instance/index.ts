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

  const rawUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
  const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  };

  try {
    const { action, instanceName } = await req.json();

    if (!instanceName) {
      return new Response(JSON.stringify({ error: 'instanceName is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      // Create a new Evolution API instance
      const response = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Evolution API error [${response.status}]: ${JSON.stringify(data)}`);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'connect') {
      // Get QR Code for instance
      const response = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Evolution API error [${response.status}]: ${JSON.stringify(data)}`);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const response = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Evolution API error [${response.status}]: ${JSON.stringify(data)}`);
      }
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'logout') {
      const response = await fetch(`${baseUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const response = await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'restart') {
      // Restart instance (reconnect)
      const response = await fetch(`${baseUrl}/instance/restart/${instanceName}`, {
        method: 'PUT',
        headers,
      });
      const data = await response.json();
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: create, connect, status, logout, delete, restart' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Instance management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
