ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS controle_conversa text NOT NULL DEFAULT 'bot',
ADD COLUMN IF NOT EXISTS precisa_humano boolean NOT NULL DEFAULT false;