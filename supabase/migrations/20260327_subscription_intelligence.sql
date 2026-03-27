-- Migration: subscription_intelligence
-- Descrição: Adiciona campos para controle de lembretes e status de cobrança automática

-- Alterar a tabela assinaturas para suportar controle de lembretes
ALTER TABLE public.assinaturas ADD COLUMN IF NOT EXISTS ultimo_lembrete_enviado DATE;

-- Índice para busca rápida de assinaturas ativas que estão para vencer
CREATE INDEX IF NOT EXISTS idx_assinaturas_vencimento ON public.assinaturas (data_fim) 
WHERE status = 'ativo';

-- Índice para busca rápida de lojas suspensas ou ativas
CREATE INDEX IF NOT EXISTS idx_lojas_status_cobranca ON public.lojas (status_aprovacao);

-- Comentário para documentar o novo status
COMMENT ON COLUMN public.lojas.status_aprovacao IS 'Status: pendente_aprovacao, ativo, suspenso, cancelado';
