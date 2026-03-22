ALTER TABLE public.mensagens 
ADD COLUMN respondido_por uuid REFERENCES auth.users(id),
ADD COLUMN respondido_por_nome text;