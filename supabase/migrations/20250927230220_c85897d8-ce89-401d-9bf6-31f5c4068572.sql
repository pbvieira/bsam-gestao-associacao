-- Criar função para obter email do usuário
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = user_uuid;
$$;

-- Dar permissão para usar a função
GRANT EXECUTE ON FUNCTION public.get_user_email(uuid) TO authenticated;