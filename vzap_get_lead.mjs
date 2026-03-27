async function getLead() {
  const leadId = "49e5b64c-a7af-4379-8fd7-e5d740af9b3b";
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1/leads?id=eq.${leadId}&select=id,nome,controle_conversa,bot_enabled`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  const res = await fetch(url, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  
  const data = await res.json();
  console.log("Dados do Lead:", JSON.stringify(data, null, 2));
}

getLead();
