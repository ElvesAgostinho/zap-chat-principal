-- ==================================================================================
-- AUTO-CONFIRMAÇÃO DE EMAILS NO SUPABASE
-- Objetivo: Contornar os limites e problemas de SMTP do servidor gratuito do Supabase
-- Ação: Confirma automaticamente todos os e-mails antigos e os futuros cadastros.
-- ==================================================================================

-- 1. Cria a função que obriga o novo utilizador a entrar "já confirmado"
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Define a hora exata da confirmação para o momento do registo
  NEW.email_confirmed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpa o trigger se ele já existir (para evitar erros ao rodar o script 2 vezes)
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- 3. Aplica o trigger na tabela oficial de autenticação do Supabase
CREATE TRIGGER auto_confirm_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();

-- ==================================================================================
-- 4. ATUALIZAÇÃO RETROATIVA
-- ==================================================================================
-- Esta linha vai confirmar na hora o seu email atual (elvessapuri57@gmail.com) e todos
-- os outros utilizadores que estavam bloqueados à espera de confirmação.
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;
