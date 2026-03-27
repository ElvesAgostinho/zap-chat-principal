async function finalTest() {
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/whatsapp-webhook`;
  const body = {
    instance: "Whats",
    data: {
      key: { remoteJid: "244900123456@s.whatsapp.net", fromMe: false },
      pushName: "Cliente Teste",
      message: { conversation: "Olá, o bot está a funcionar agora?" },
      messageTimestamp: Math.floor(Date.now() / 1000)
    },
    event: "messages.upsert"
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  
  const data = await res.json();
  console.log("Resultado Webhook:", JSON.stringify(data, null, 2));
}

finalTest();
