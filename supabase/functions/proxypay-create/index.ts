import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { venda_id, amount, customer_name } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get API credentials from env
    const PROXYPAY_API_KEY = Deno.env.get("PROXYPAY_API_KEY");
    
    // In production, Proxypay doesn't need a Config ID for public references, 
    // but some integrations might use a custom identifier.
    
    if (!PROXYPAY_API_KEY) {
      console.error("PROXYPAY_API_KEY is not set.");
      // FALLBACK for development: Generate a "dummy" reference
      const dummyRef = Math.floor(Math.random() * 900000000) + 100000000;
      
      const { data: payment, error: pError } = await supabaseClient
        .from("pagamentos")
        .insert({
          venda_id,
          referencia: dummyRef.toString(),
          valor: amount,
          status: "pendente",
          provedor: "proxypay_simulated"
        })
        .select()
        .single();

      if (pError) throw pError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          reference: dummyRef.toString(), 
          simulated: true,
          message: "Modo Simulação: Credenciais Proxypay não configuradas." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 2. Call Proxypay API
    // POST https://api.proxypay.co/references
    const response = await fetch("https://api.proxypay.co/references", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${PROXYPAY_API_KEY}`,
        "Accept": "application/vnd.proxypay.v2+json"
      },
      body: JSON.stringify({
        amount: amount.toString(),
        custom_fields: {
          venda_id: venda_id,
          customer_name: customer_name
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxypay API Error: ${errorText}`);
    }

    const proxypayData = await response.json();
    const reference = proxypayData.reference;

    // 3. Save to database
    const { error: dbError } = await supabaseClient
      .from("pagamentos")
      .insert({
        venda_id,
        referencia: reference,
        valor: amount,
        status: "pendente",
        provedor: "proxypay"
      });

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify({ success: true, reference }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
