-- V2 Architecture: Media Management & Lead Auditing

-- 1. Tabela de Auditoria de Leads (Timeline)
CREATE TABLE IF NOT EXISTS public.lead_eventos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id), -- Quem fez a ação
    tipo text NOT NULL, -- 'mudanca_status', 'transferencia', 'nota', 'venda'
    descritivo text NOT NULL,
    dados_anteriores jsonb,
    dados_novos jsonb,
    criado_em timestamp with time zone DEFAULT now()
);

-- 2. Habilitar RLS para auditoria
ALTER TABLE public.lead_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lead events of their store" ON public.lead_eventos
    FOR SELECT TO authenticated
    USING (loja_id IN (SELECT loja_id FROM public.usuarios_loja WHERE user_id = auth.uid()));

-- 3. Trigger para registrar mudanças de status automaticamente
CREATE OR REPLACE FUNCTION public.log_lead_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.lead_eventos (lead_id, loja_id, user_id, tipo, descritivo, dados_anteriores, dados_novos)
        VALUES (NEW.id, NEW.loja_id, auth.uid(), 'mudanca_status', 
                'Status alterado de ' || OLD.status || ' para ' || NEW.status,
                jsonb_build_object('status', OLD.status),
                jsonb_build_object('status', NEW.status));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_lead_status ON public.leads;
CREATE TRIGGER tr_log_lead_status
AFTER UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.log_lead_changes();

-- 4. Bucket de Storage (Instruções para o console Supabase)
-- Nota: Buckets não podem ser criados via SQL puro em todas as versões,
-- mas aqui estão as políticas de segurança caso você crie os buckets 'media' no painel:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;

-- Política de acesso para o bucket de mídia
-- (Pode ser aplicado no painel de Storage do Supabase)
/*
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');
*/
