-- Trigger para notificar atendentes quando um lead é transferido

CREATE OR REPLACE FUNCTION public.notify_lead_transfer()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o atendente mudou e não é nulo
    IF (OLD.atendente_id IS DISTINCT FROM NEW.atendente_id AND NEW.atendente_id IS NOT NULL) THEN
        INSERT INTO public.notificacoes (
            loja_id,
            user_id, -- Notifica o NOVO atendente
            titulo,
            mensagem,
            tipo,
            lida
        ) VALUES (
            NEW.loja_id,
            (SELECT user_id FROM public.usuarios_loja WHERE id = NEW.atendente_id LIMIT 1),
            'Novo Lead Atribuído',
            'O lead ' || NEW.nome || ' foi transferido para você.',
            'info',
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notifica_transferencia_lead ON public.leads;
CREATE TRIGGER tr_notifica_transferencia_lead
AFTER UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.notify_lead_transfer();
