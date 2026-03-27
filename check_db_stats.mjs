import { createClient } from '@supabase/supabase-js';

const url = "https://lzjbdoeufeyqrijfazoc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

const supabase = createClient(url, key);

async function check() {
  const tables = ['lojas', 'usuarios_loja', 'leads', 'mensagens', 'produtos', 'vendas'];
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`Table ${table}: Error ${error.message}`);
    } else {
      console.log(`Table ${table}: ${count} rows`);
    }
  }
}

check();
