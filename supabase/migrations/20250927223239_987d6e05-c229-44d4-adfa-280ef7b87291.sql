-- Update the is_admin_user function to include administrador role
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = check_user_id 
    AND role IN ('diretor', 'coordenador', 'administrador')
  );
$function$