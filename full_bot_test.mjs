async function runFullBotTest() {
  const storeId = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/whatsapp-connection`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  // 1. Get leads
  const leadsRes = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ action: "get_store_leads", store_id: storeId })
  });
  const { leads } = await leadsRes.json();
  if (!leads || !leads.length) {
    console.log("Nenhum lead encontrado para a Loja Lua.");
    return;
  }
  
  const leadId = leads[0].id;
  console.log(`Testando bot para Lead: ${leadId} (${leads[0].nome || 'Sem nome'})`);
  
  // 2. Call ai-sales-bot
  const botUrl = `https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/ai-sales-bot`;
  const botRes = await fetch(botUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: leadId,
      store_id: storeId,
      message_text: "Olá, quais são os preços dos sapatos?",
    })
  });
  
  const botData = await botRes.json();
  console.log("Resposta do Bot (Status " + botRes.status + "):", JSON.stringify(botData, null, 2));
}

runFullBotTest();
