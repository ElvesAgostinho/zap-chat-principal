import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzjbdoeufeyqrijfazoc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testBot() {
  console.log('Fetching a valid store and lead...');
  
  // Get first store
  const { data: stores, error: storeError } = await supabase.from('lojas').select('id, nome').limit(1);
  if (storeError || !stores.length) {
    console.error('Error fetching store:', storeError);
    return;
  }
  const storeId = stores[0].id;
  console.log(`Found store: ${stores[0].nome} (${storeId})`);

  // Get first lead for this store
  const { data: leads, error: leadError } = await supabase.from('leads').select('id, telefone').eq('loja_id', storeId).limit(1);
  if (leadError || !leads.length) {
    console.error('Error fetching lead:', leadError);
    return;
  }
  const leadId = leads[0].id;
  console.log(`Found lead: ${leads[0].telefone} (${leadId})`);

  console.log('\n--- SIMULATING MESSAGE: "Agendamento de visita" ---');
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-sales-bot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({
      message_text: "Agendamento de visita",
      store_id: storeId,
      lead_id: leadId
    })
  });

  const text = await response.text();
  console.log('Response Status:', response.status);
  try {
    const json = JSON.parse(text);
    console.log('\nBOT REPLY:\n', json.reply);
    console.log('\nMETADATA:\n', JSON.stringify({
      schedule_data: json.schedule_data,
      requested_products: json.requested_products,
      send_location: json.send_location
    }, null, 2));
  } catch(e) {
    console.log('\nRAW RESPONSE:\n', text);
  }
}

testBot();
