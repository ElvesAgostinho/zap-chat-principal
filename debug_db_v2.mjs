async function debugDb() {
  const storeId = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua
  const url = `https://lzjbdoeufeyqrijfazoc.supabase.co/functions/v1/whatsapp-connection`;
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      action: "debug_db",
      store_id: storeId
    })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

debugDb();
