const supabaseUrl = 'https://lzjbdoeufeyqrijfazoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4';

const storeId = '11111111-1111-1111-1111-111111111111';
const leadId = '22222222-2222-2222-2222-222222222222';

async function test(scenario, text) {
  console.log(`\n--- SCENARIO: ${scenario} ---`);
  console.log(`User: "${text}"`);

  const res = await fetch(`${supabaseUrl}/functions/v1/ai-sales-bot`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ lead_id: leadId, store_id: storeId, message_text: text })
  });

  const data = await res.json();
  console.log('Bot Suggestion:', data.reply || '(No reply)');
  console.log('Metadata Tokens:', JSON.stringify({
    agendar: data.schedule_data,
    localizacao: data.send_location,
    pagamento: data.send_payment
  }, null, 2));

  if (scenario === 'Agendamento' && !data.schedule_data) console.error('FAILED: No schedule_data!');
  if (scenario === 'Localização' && !data.send_location) console.error('FAILED: No send_location marker!');
}

async function runTests() {
  await test('Agendamento', 'Boa tarde, pretendo um novo agendamento para amanhã às 8h.');
  await test('Localização', 'Onde fica a vossa loja?');
  await test('Pagamento', 'Pode me enviar o IBAN para o pagamento?');
}

runTests();
