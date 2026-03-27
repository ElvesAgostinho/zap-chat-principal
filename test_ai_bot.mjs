async function findLeadAndTestBot() {
  const storeId = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1/leads?loja_id=eq.${storeId}&limit=1`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  // 1. Get a lead ID
  const leadRes = await fetch(url, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  const leads = await leadRes.json();
  if (!leads.length) {
    console.log("Nenhum lead encontrado para teste.");
    return;
  }
  const leadId = leads[0].id;
  console.log(`Testando bot para Lead: ${leadId} (${leads[0].nome})`);
  
  // 2. Call ai-sales-bot
  const botUrl = `https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/ai-sales-bot`;
  const botRes = await fetch(botUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      leadId: leadId,
      message: "Olá, gostaria de saber mais sobre os produtos",
      instanceName: "Whats"
    })
  });
  
  const botText = await botRes.text();
  console.log("Resposta do Bot:", botRes.status, botText);
}

findLeadAndTestBot();
