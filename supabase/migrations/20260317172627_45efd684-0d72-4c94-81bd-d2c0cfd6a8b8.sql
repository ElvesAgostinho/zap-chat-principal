-- Fix store_instances: rename to match Evolution API instance name 'Whats'
UPDATE public.store_instances SET instance_name = 'Whats' WHERE store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b';

-- Consolidate: link profile to Sapatos Top store
UPDATE public.profiles SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE id = '63e87805-f05d-47fc-b96b-f38df10c28fa';

-- Set owner on Sapatos Top
UPDATE public.stores SET owner_id = '63e87805-f05d-47fc-b96b-f38df10c28fa' WHERE id = '382ffc7c-b88f-482e-9795-4a1c446b051b';

-- Migrate all data from old store to new store
UPDATE public.usuarios SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.messages SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.leads SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.unresolved_bot_messages SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.pedidos SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.bot_learning SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';
UPDATE public.store_config SET store_id = '382ffc7c-b88f-482e-9795-4a1c446b051b' WHERE store_id = '00000000-0000-0000-0000-000000000001';

-- Delete the orphaned store
DELETE FROM public.stores WHERE id = '00000000-0000-0000-0000-000000000001';