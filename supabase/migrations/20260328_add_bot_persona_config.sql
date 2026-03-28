-- Migração para suporte a Persona v2 do Bot
-- Adiciona configurações de Tom de Voz e Política de Agendamento à tabela lojas

ALTER TABLE public.lojas 
ADD COLUMN IF NOT EXISTS tom_voz text DEFAULT 'formal' CHECK (tom_voz IN ('formal', 'descontraído')),
ADD COLUMN IF NOT EXISTS politica_agendamento text DEFAULT 'opcional' CHECK (politica_agendamento IN ('false', 'opcional', 'obrigatorio')),
ADD COLUMN IF NOT EXISTS catalogo_url_placeholder text;

-- Atualizar valores padrão para lojas existentes se necessário
UPDATE public.lojas SET tom_voz = 'formal' WHERE tom_voz IS NULL;
UPDATE public.lojas SET politica_agendamento = 'opcional' WHERE politica_agendamento IS NULL;
