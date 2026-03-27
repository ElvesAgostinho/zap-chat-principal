async function checkBotReply() {
  const leadId = "aa65922e-32f5-488b-b08c-eff383d916c7"; // Dr. Sacapuri
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1/mensagens?lead_id=eq.${leadId}&order=created_at.desc&limit=5`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  const res = await fetch(url, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  
  const msgs = await res.json();
  console.log("Últimas mensagens do lead:");
  msgs.forEach(m => {
    console.log(`[${m.tipo === 'recebida' ? 'IN' : 'OUT'}] ${m.is_bot ? '(BOT)' : ''} ${m.conteudo.slice(0, 50)}...`);
  });
}

checkBotReply();
