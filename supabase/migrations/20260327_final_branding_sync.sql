-- SCRIPT DE UNIFICAÇÃO DE BRANDING FINAL (SUPABASE)
-- 1. Renomear os planos na tabela mestra para o novo padrão comercial
UPDATE public.planos SET nome = 'Starter' WHERE nome = 'Iniciante' OR nome = 'Grátis';

-- 2. Atualizar todas as lojas que ainda usam os nomes antigos nos seus registos
UPDATE public.lojas SET plano = 'starter' WHERE plano = 'iniciante' OR plano = 'gratis' OR plano IS NULL;

-- 3. Garantir que as assinaturas ativas usem os termos corretos e estejam bem vinculadas
UPDATE public.assinaturas SET status = 'ativo' WHERE status = 'pago' AND data_fim > NOW();

-- 4. Adicionar nota explicativa adicional
COMMENT ON TABLE public.planos IS 'Tabela de planos SaaS: Starter (Iniciante), Profissional (Intermédio), Enterprise (Avançado)';
