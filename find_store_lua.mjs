async function findStore() {
  const url = "https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1/lojas?nome=ilike.*Lua*&select=id,nome,instance_name";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  
  const res = await fetch(url, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  
  if (!res.ok) {
    console.error("Fetch failed:", res.status, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

findStore();
