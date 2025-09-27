-- Criar função para contar administradores ativos
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER 
  FROM public.profiles 
  WHERE active = true 
  AND role = 'administrador'::user_role;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION public.count_active_admins() TO authenticated;

-- Criar função trigger para prevenir exclusão do último admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se está desativando um administrador
  IF OLD.role = 'administrador'::user_role AND OLD.active = true AND NEW.active = false THEN
    -- Verificar se é o último administrador
    IF (SELECT public.count_active_admins()) <= 1 THEN
      RAISE EXCEPTION 'Não é possível desativar o último administrador do sistema. Deve haver pelo menos um administrador ativo.';
    END IF;
  END IF;
  
  -- Verificar se está mudando o papel de administrador para outra função
  IF OLD.role = 'administrador'::user_role AND NEW.role != 'administrador'::user_role AND OLD.active = true THEN
    -- Verificar se é o último administrador
    IF (SELECT public.count_active_admins()) <= 1 THEN
      RAISE EXCEPTION 'Não é possível alterar o papel do último administrador. Deve haver pelo menos um administrador ativo.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger na tabela profiles
CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_last_admin_deletion();