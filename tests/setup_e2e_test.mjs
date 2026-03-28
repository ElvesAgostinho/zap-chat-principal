import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzjbdoeufeyqrijfazoc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6amJkb2V1ZmV5cXJpamZhem9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI0MjYsImV4cCI6MjA4MzAzODQyNn0.y1-o8TrYHHJ9Eu0bdDhpS5Ia4n18GckB4prKEHnYIy4'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('--- Setting up E2E Test Data ---');

  const storeId = '11111111-1111-1111-1111-111111111111';
  
  // 1. Store
  await supabase.from('lojas').upsert({
    id: storeId,
    nome: 'Móveis Elite - Teste IA',
    endereco: 'Via S8, Edifício Platinum, Talatona, Luanda',
    telefone: '244900000000',
    bot_ativo: true,
    linguagem_bot: 'Seja extremamente educado e use Português de Portugal (sem gerúndios brasileiros). Proibido enviar fotos sem que peçam.',
    idioma: 'pt-PT',
    tipo_negocio: 'Mobiliário de Luxo'
  });

  // 2. Horários (Open every day 08:00 - 18:00)
  await supabase.from('horarios_loja').delete().eq('loja_id', storeId);
  const days = [0, 1, 2, 3, 4, 5, 6];
  const horarios = days.map(d => ({
    loja_id: storeId,
    dia_semana: d,
    hora_inicio: '08:00',
    hora_fim: '18:00',
    ativo: true
  }));
  await supabase.from('horarios_loja').insert(horarios);

  // 3. Serviços
  await supabase.from('servicos_loja').delete().eq('loja_id', storeId);
  await supabase.from('servicos_loja').insert([
    { loja_id: storeId, nome: 'Consultoria de Decoração', duracao_min: 60, preco: 15000, ativo: true },
    { loja_id: storeId, nome: 'Montagem de Móveis', duracao_min: 120, preco: 5000, ativo: true }
  ]);

  // 4. Payments
  await supabase.from('formas_pagamento').delete().eq('loja_id', storeId);
  await supabase.from('formas_pagamento').insert([
    { loja_id: storeId, tipo: 'IBAN (Banco BAI)', detalhes: 'AO06 0040 0000 1234 5678 1012 3', is_active: true }
  ]);

  console.log('--- Test Data Ready (with schedules) ---');
}

setup();
