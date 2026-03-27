import { createClient } from '@supabase/supabase-js';

const url = "https://lzjbdoeufeyqrijfazoc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

const supabase = createClient(url, key);

async function check() {
  const instances = ['Whats'];
  const store_id = "382ffc7c-b88f-482e-9795-4a1c446b051b"; // Loja Lua ID
  
  for (const instance of instances) {
    console.log(`Checking instance: ${instance} for store: ${store_id}...`);
    const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
      body: { action: 'status', instance, store_id }
    });
    
    if (error) {
      console.log(`Instance ${instance}: Error ${error.message}`);
    } else {
      console.log(`Instance ${instance}:`, JSON.stringify(data, null, 2));
    }
  }
}

check();
