
-- Delete all messages for the store first (they're all from old import)
DELETE FROM mensagens WHERE loja_id = '382ffc7c-b88f-482e-9795-4a1c446b051b';

-- Delete all imported leads 
DELETE FROM leads WHERE loja_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' AND 'importado' = ANY(tags);
