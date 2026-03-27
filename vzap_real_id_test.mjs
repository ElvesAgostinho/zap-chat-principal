async function realIdTest() {
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/ai-sales-bot`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  const body = {
    lead_id: "49e5b64c-a7af-4379-8fd7-e5d740af9b3b",
    store_id: "382ffc7c-b88f-482e-9795-4a1c446b051b",
    message_text: "Olá, quais os sapatos disponíveis?"
  };
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify(body)
  });
  
  const data = await res.json();
  console.log("Resultado IA (Real IDs):", JSON.stringify(data, null, 2));
}

realIdTest();
