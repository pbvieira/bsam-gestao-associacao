-- Habilitar REPLICA IDENTITY FULL para a tabela tasks para capturar todas as mudanças
ALTER TABLE public.tasks REPLICA IDENTITY FULL;