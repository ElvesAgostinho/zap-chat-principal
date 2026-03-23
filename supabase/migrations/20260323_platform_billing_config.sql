-- 20260323_platform_billing_config.sql
-- Tabela para guardar configurações globais da plataforma (como os dados bancários do Super Admin)

CREATE TABLE IF NOT EXISTS public.platform_config (
    id integer PRIMARY KEY DEFAULT 1,
    bank_name text NOT NULL DEFAULT 'BAI (Banco Angolano de Investimentos)',
    account_name text NOT NULL DEFAULT 'ZAP VENDAS TECNOLOGIA',
    iban text NOT NULL DEFAULT 'AO06 0000 0000 0000 0000 0000 0',
    updated_at timestamp with time zone DEFAULT now(),
    -- Restringe a tabela a ter apenas 1 linha
    CONSTRAINT platform_config_single_row CHECK (id = 1)
);

-- Insere os dados padrão se a linha não existir
INSERT INTO public.platform_config (id, bank_name, account_name, iban)
VALUES (1, 'BAI (Banco Angolano de Investimentos)', 'ZAP VENDAS TECNOLOGIA', 'AO06 0000 0000 0000 0000 0000 0')
ON CONFLICT (id) DO NOTHING;

-- Configuração do Row Level Security (Segurança)
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa logada (mesmo utilizadores de Lojas) precisa poder LER isto (na hora de ver os dados para transferir dinheiro)
CREATE POLICY "Qualquer pessoa logada pode ler a config da plataforma"
ON public.platform_config
FOR SELECT
TO authenticated
USING (true);

-- APENAS o super_admin pode alterar as definições da plataforma
CREATE POLICY "Apenas Super Admins podem atualizar a config da plataforma"
ON public.platform_config
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Garante que só Super Admins podem inserir novos registos (proteção extra)
CREATE POLICY "Apenas Super Admins podem inserir na config da plataforma"
ON public.platform_config
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- Função automática para atualizar o updated_at na modificação
CREATE OR REPLACE FUNCTION public.handle_updated_at_platform_config()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_platform_config_updated_at ON public.platform_config;
CREATE TRIGGER tr_platform_config_updated_at
BEFORE UPDATE ON public.platform_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_platform_config();
