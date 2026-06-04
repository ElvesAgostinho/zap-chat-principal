import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lzjbdoeufeyqrijfazoc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4'
);

async function check() {
  const { data: lojas } = await supabase.from('lojas').select('id, nome, bot_ativo, instance_name');
  console.log("Lojas:", lojas);

  if (lojas && lojas.length > 0) {
    for (const loja of lojas) {
      const { data: automacoes } = await supabase.from('automacoes').select('id, nome, ativo, trigger_keyword').eq('loja_id', loja.id);
      console.log(`Automações da loja ${loja.nome}:`, automacoes);
    }
  }
}
check();
