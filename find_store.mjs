import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzjbdoeufeyqrijfazoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('lojas')
    .select('id, nome, instance_name')
    .limit(5);

  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('--- LOJAS NO SISTEMA ---');
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
