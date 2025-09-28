-- Fase 1: Remoção completa do sistema de permissões

-- 1. Remover o trigger auto_grant_admin_permissions
DROP TRIGGER IF EXISTS auto_grant_admin_permissions ON public.permissions;

-- 2. Remover a função grant_permission_to_admin
DROP FUNCTION IF EXISTS public.grant_permission_to_admin();

-- 3. Dropar a tabela permissions (isso automaticamente remove as policies RLS)
DROP TABLE IF EXISTS public.permissions CASCADE;