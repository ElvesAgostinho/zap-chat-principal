
async function findLuaStores() {
  const url = "https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  const headers = { "apikey": key, "Authorization": `Bearer ${key}` };

  console.log("--- BUSCANDO LOJAS QUE CONTÊM 'LUA' ---");
  const res = await fetch(`${url}/lojas?nome=ilike.*Lua*&select=id,nome,instance_name`, { headers });
  const lojas = await res.json();
  console.log(JSON.stringify(lojas, null, 2));

  if (lojas.length > 0) {
    for (const loja of lojas) {
      console.log(`\n--- VERIFICANDO USUÁRIOS PARA LOJA: ${loja.nome} (${loja.id}) ---`);
      const resU = await fetch(`${url}/usuarios_loja?loja_id=eq.${loja.id}&select=user_id,nome`, { headers });
      const users = await resU.json();
      console.log(`Usuários: ${JSON.stringify(users)}`);
      
      console.log(`--- VERIFICANDO AGENDAMENTOS PARA LOJA: ${loja.id} ---`);
      const resA = await fetch(`${url}/agendamentos?loja_id=eq.${loja.id}&limit=1&select=id`, { headers });
      const ags = await resA.json();
      console.log(`Agendamentos existiam? ${ags.length > 0 ? 'SIM' : 'NÃO'}`);
    }
  }
}

findLuaStores();
