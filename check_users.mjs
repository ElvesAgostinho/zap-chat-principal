
async function checkUsers() {
  const url = "https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  const headers = { "apikey": key, "Authorization": `Bearer ${key}` };

  console.log("--- USUÁRIOS VINCULADOS À LOJA LUA ---");
  const storeId = "382ffc7c-b88f-482e-9795-4a1c446b051b";
  const res = await fetch(`${url}/usuarios_loja?loja_id=eq.${storeId}&select=user_id,nome,role,status`, { headers });
  const users = await res.json();
  console.log(JSON.stringify(users, null, 2));
}

checkUsers();
