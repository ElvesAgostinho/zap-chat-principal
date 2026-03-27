import { createClient } from '@supabase/supabase-js';

const url = "https://lzjbdoeufeyqrijfazoc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

const supabase = createClient(url, key);

async function diagnose() {
  console.log("Invoking whatsapp-connection:debug_db...");
  const { data, error } = await supabase.functions.invoke('whatsapp-connection', {
    body: { action: 'debug_db' }
  });

  if (error) {
    console.error("Invoke Error:", error);
  } else {
    console.log("DEBUG_DB Response:", JSON.stringify(data, null, 2));
  }
}

diagnose();
