async function applyFixes() {
  const storeId = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";
  const baseUrl = "https://lzjbdoeufeyqrijfazoc.supabase.co/rest/v1";

  // 1. Initialize Schedules
  const schedules = [
    { loja_id: storeId, dia_semana: 1, hora_inicio: "08:00", hora_fim: "18:00", ativo: true },
    { loja_id: storeId, dia_semana: 2, hora_inicio: "08:00", hora_fim: "18:00", ativo: true },
    { loja_id: storeId, dia_semana: 3, hora_inicio: "08:00", hora_fim: "18:00", ativo: true },
    { loja_id: storeId, dia_semana: 4, hora_inicio: "08:00", hora_fim: "18:00", ativo: true },
    { loja_id: storeId, dia_semana: 5, hora_inicio: "08:00", hora_fim: "18:00", ativo: true },
  ];

  console.log("Inicializando horários...");
  const resSched = await fetch(`${baseUrl}/horarios_loja`, {
    method: "POST",
    headers: { "apikey": key, "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify(schedules)
  });
  console.log("Horários:", resSched.status);

  // 2. We can't easily create indexes via REST with Anon key.
  // I will check if I can use the Service Role key to apply a migration or a SQL call.
}

applyFixes();
