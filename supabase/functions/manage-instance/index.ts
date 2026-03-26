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
    console.error('[manage-instance] Missing configuration');
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'EVOLUTION_API_KEY or EVOLUTION_API_URL not configured in Supabase' 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rawUrl = EVOLUTION_API_URL.replace(/\/+$/, '');
  const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const headers = {
    'Content-Type': 'application/json',
    'apikey': EVOLUTION_API_KEY,
  };

  const evo = async (url: string, init: RequestInit = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000); // 20s timeout
    try {
      const res = await fetch(url, { 
        ...init, 
        headers: { ...headers, ...(init.headers || {}) },
        signal: controller.signal
      });
      const text = await res.text();
      let data = null;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
      return { ok: res.ok, status: res.status, data };
    } catch (e: any) {
      const isTimeout = e.name === 'AbortError';
      return { ok: false, status: isTimeout ? 408 : 500, data: { error: isTimeout ? 'Evolution API timeout' : e.message } };
    } finally {
      clearTimeout(id);
    }
  };

  try {
    const body = await req.json();
    const { action, instanceName } = body;

    if (!instanceName) {
      return new Response(JSON.stringify({ success: false, error: 'instanceName is required' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      const result = await evo(`${baseUrl}/instance/create`, {
        method: 'POST',
        body: JSON.stringify({ instanceName, integration: 'WHATSAPP-BAILEYS', qrcode: true }),
      });
      return new Response(JSON.stringify({ success: result.ok, data: result.data, error: result.ok ? null : (result.data?.error || 'Failed to create') }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'connect') {
      const result = await evo(`${baseUrl}/instance/connect/${instanceName}`, { method: 'GET' });
      return new Response(JSON.stringify({ success: result.ok, data: result.data, error: result.ok ? null : (result.data?.error || 'Failed to connect') }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'status') {
      const result = await evo(`${baseUrl}/instance/connectionState/${instanceName}`, { method: 'GET' });
      return new Response(JSON.stringify({ success: result.ok, data: result.data, error: result.ok ? null : (result.data?.error || 'Failed to check status') }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'logout') {
      const result = await evo(`${baseUrl}/instance/logout/${instanceName}`, { method: 'DELETE' });
      return new Response(JSON.stringify({ success: true, data: result.data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const result = await evo(`${baseUrl}/instance/delete/${instanceName}`, { method: 'DELETE' });
      return new Response(JSON.stringify({ success: true, data: result.data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'restart') {
      const result = await evo(`${baseUrl}/instance/restart/${instanceName}`, { method: 'PUT' });
      return new Response(JSON.stringify({ success: result.ok, data: result.data }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action. Use: create, connect, status, logout, delete, restart' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[manage-instance] Global Failure:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error?.message || String(error)
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
