async function checkSchedules() {
  const storeId = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1/horarios_loja?loja_id=eq.${storeId}`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  const res = await fetch(url, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  
  const data = await res.json();
  console.log("Horários da Loja Lua:", JSON.stringify(data, null, 2));

  // Also check if any schedules exist for the lead
  const leadId = "49e5b64c-a7af-4379-8fd7-e5d740af9b3b";
  const urlSched = `https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1/agendamentos?lead_id=eq.${leadId}`;
  const resSched = await fetch(urlSched, {
    headers: { "apikey": key, "Authorization": `Bearer ${key}` }
  });
  const dataSched = await resSched.json();
  console.log("Agendamentos existentes do lead:", JSON.stringify(dataSched, null, 2));
}

checkSchedules();
