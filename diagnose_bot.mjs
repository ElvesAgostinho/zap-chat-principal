import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzjbdoeufeyqrijfazoc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnose() {
  try {
    console.log("Fetching stores...");
    const { data: lojas, error: lojaError } = await supabase.from('lojas').select('id, nome, instance_name, bot_ativo').limit(5);
    
    if (lojaError) {
      console.error("Loja Fetch Error:", lojaError);
      return;
    }

    if (!lojas || lojas.length === 0) {
      console.error("No stores found!");
      return;
    }
    
    for (const store of lojas) {
      console.log(`\n--- Store: ${store.nome} (${store.id}) ---`);
      console.log(`Instance: ${store.instance_name}, Bot Active: ${store.bot_ativo}`);
      
      console.log("Invoking debug_db...");
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
          body: { action: 'debug_db', store_id: store.id }
        });
        
        if (error) {
          console.error("Invoke Error (debug_db):", error);
        } else {
          console.log("DEBUG_DB:", JSON.stringify(data, null, 2));
        }

        console.log("Invoking status check...");
        const { data: statusData, error: statusError } = await supabase.functions.invoke('whatsapp-connection', {
            body: { action: 'status', store_id: store.id, instance: store.instance_name }
        });

        if (statusError) {
            console.error("Invoke Error (status):", statusError);
        } else {
            console.log("STATUS:", JSON.stringify(statusData, null, 2));
        }

      } catch (e) {
        console.error("Function call failed:", e.message);
      }
    }

    // Check recent messages
    console.log("\nChecking last 5 messages...");
    const { data: messages } = await supabase.from('mensagens').select('id, lead_nome, conteudo, tipo, is_bot, created_at').order('created_at', { ascending: false }).limit(5);
    console.log("Recent Messages:", JSON.stringify(messages, null, 2));

  } catch (err) {
    console.error("Diagnosis failed:", err.message);
  }
}

diagnose();
