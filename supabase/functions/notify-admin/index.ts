// Follow this setup guide to run the Edge Function:
// 1. SUPABASE_URL and SUPABASE_ANON_KEY are automatically injected.
// 2. Set your Resend API key: supabase secrets set RESEND_API_KEY=YOUR_KEY
// 3. Deploy: supabase functions deploy notify-admin

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPER_ADMIN_EMAIL = "geral@topconsultores.pt";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { storeName, adminName, adminEmail } = await req.json();

    if (!storeName || !adminName) {
      throw new Error("Faltam dados da loja ou do administrador");
    }

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não configurada. Simulando envio de notificação no log.");
      return new Response(
        JSON.stringify({ message: "Notificação simulada com sucesso (Chave Resend ausente no Supabase Secrets)", mode: "simulation" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Resend API to send the email
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ZapVendas Notificações <onboarding@resend.dev>", // Change this if you have a custom domain in Resend
        to: [SUPER_ADMIN_EMAIL],
        subject: `[VendaZap] Nova empresa a aguardar aprovação: ${storeName}`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Nova Empresa Registada no VendaZap!</h2>
            <p>Olá Equipa Top IA,</p>
            <p>Uma nova empresa acabou de se registar e encontra-se a aguardar validação manual.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Empresa:</strong> ${storeName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Nome do Admin:</strong> ${adminName}</p>
                <p style="margin: 0;"><strong>Email de Registo:</strong> ${adminEmail}</p>
            </div>
            
            <p>Por favor, aceda ao <a href="https://zapvendas.com/super-admin" style="color: #10B981; font-weight: bold;">Painel de Super Admin</a> para aprovar ou rejeitar esta loja.</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Notificação automática do sistema VendaZap.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (res.ok) {
        return new Response(
        JSON.stringify({ message: "Notificação enviada com sucesso para o Super Admin", data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } else {
        throw new Error(`Erro ao enviar email pelo Resend: ${JSON.stringify(data)}`);
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
