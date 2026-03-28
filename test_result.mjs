import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzjbdoeufeyqrijfazoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('loja_id', '382ffc7c-b88f-482e-9795-4a1c446b051b')
    .order('criado_em', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('--- ÚLTIMO AGENDAMENTO ENCONTRADO ---');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
