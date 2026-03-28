import fetch from 'node-fetch';

const WEBHOOK_URL = "https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/whatsapp-webhook";
const STORE_ID = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua

async function testScheduling() {
  console.log("🚀 Iniciando Teste de Agendamento (Persona v2)...");
  
  const payload = {
    event: "messages.upsert",
    instance: "LojaLua-800",
    data: {
      key: { remoteJid: "244923000000@s.whatsapp.net", fromMe: false, id: "TEST_" + Date.now() },
      pushName: "Elves Agostinho",
      message: { conversation: "Olá! Gostaria de marcar uma Manicure para amanhã às 10:00. É possível?" },
      messageType: "conversation"
    }
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("✅ Resposta do Webhook:", JSON.stringify(data, null, 2));
    
    if (data.reply) {
      console.log("\n🤖 FRASE DO BOT (pt-PT):", data.reply);
      console.log("\n🧪 VERIFICAÇÃO DE PERSONA:");
      console.log("- Sem negritos?", !data.reply.includes("**"));
      console.log("- Sem gerúndio brasileiro?", !data.reply.includes("vendo") && !data.reply.includes("fazendo"));
      console.log("- Marcador de agendamento detectado?", JSON.stringify(data.schedule_data));
    }
  } catch (e) {
    console.error("❌ Erro no teste:", e.message);
  }
}

testScheduling();
