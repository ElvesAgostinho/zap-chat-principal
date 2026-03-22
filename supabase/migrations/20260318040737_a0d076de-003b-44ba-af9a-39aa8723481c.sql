
-- Clean up invalid leads imported with JID numbers (from old WhatsApp number)
-- and their associated messages for store 382ffc7c-b88f-482e-9795-4a1c446b051b

-- First delete messages associated with imported leads
DELETE FROM mensagens 
WHERE loja_id = '382ffc7c-b88f-482e-9795-4a1c446b051b'
  AND lead_id IN (
    SELECT id FROM leads 
    WHERE loja_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' 
      AND tags @> ARRAY['importado']::text[]
  );

-- Then delete the invalid imported leads
DELETE FROM leads 
WHERE loja_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' 
  AND tags @> ARRAY['importado']::text[];
