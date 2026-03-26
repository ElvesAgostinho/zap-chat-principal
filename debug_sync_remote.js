const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://lzjbdoeufeyqrijfazoc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
  console.log("Fetching stores...");
  const { data: lojas, error: lojaError } = await supabase.from('lojas').select('id, nome, instance_name').limit(1);
  
  if (lojaError) {
    console.error("Loja Fetch Error:", lojaError);
    return;
  }

  if (!lojas || lojas.length === 0) {
    console.error("No stores found!");
    return;
  }
  
  const store = lojas[0];
  console.log(`Found store: ${store.nome} (${store.id}), Instance: ${store.instance_name}`);
  
  console.log("Invoking debug_db action...");
  const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
    body: { action: 'debug_db', store_id: store.id }
  });
  
  if (error) {
    console.error("Invoke Error:", error);
  } else {
    console.log("DEBUG_DB Response:", JSON.stringify(data, null, 2));
    
    if (data.success && store.instance_name) {
      console.log("Invoking sync_names to see diagnostics...");
      const syncRes = await supabase.functions.invoke('whatsapp-connection', {
        body: { action: 'sync_names', store_id: store.id, instance: store.instance_name }
      });
      console.log("SYNC_NAMES Response:", JSON.stringify(syncRes.data, null, 2));
    }
  }
}

debug();
