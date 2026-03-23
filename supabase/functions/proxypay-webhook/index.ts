import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Proxypay webhooks are usually POST requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Proxypay Webhook Received:", body);

    // Proxypay sends a JSON like:
    // { "reference": "123456789", "amount": "1500.00", "datetime": "...", "status": "paid" }
    
    const { reference, status, datetime } = body;

    if (!reference) {
      return new Response(JSON.stringify({ error: "No reference provided" }), { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Find the payment in our database
    const { data: payment, error: fetchError } = await supabaseClient
      .from("pagamentos")
      .select("id, venda_id, status")
      .eq("referencia", reference)
      .single();

    if (fetchError || !payment) {
      console.warn(`Payment reference ${reference} not found in database.`);
      return new Response(JSON.stringify({ success: false, message: "Reference not found" }), { status: 404 });
    }

    // 2. Update payment status if not already paid
    if (payment.status !== "pago") {
      const { error: updateError } = await supabaseClient
        .from("pagamentos")
        .update({ 
          status: "pago", 
          pago_em: datetime || new Date().toISOString() 
        })
        .eq("id", payment.id);

      if (updateError) throw updateError;
      
      console.log(`Payment ${payment.id} for Order ${payment.venda_id} marked as PAID.`);
      
      // The database trigger (tr_update_order_on_payment) will take care of updating 
      // the 'vendas' table and creating the lead event.
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }, 
      status: 200 
    });

  } catch (error) {
    console.error("Webhook Processing Error:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
