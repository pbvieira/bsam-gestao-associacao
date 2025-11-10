-- Corrigir a função handle_new_user para usar o role do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_count INTEGER;
  user_role user_role;
BEGIN
  -- Verificar quantos perfis existem
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  -- Tentar obter o role do metadata
  -- Se o role vier no metadata, usa ele. Caso contrário, usa as regras antigas
  user_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    CASE 
      WHEN profile_count = 0 THEN 'diretor'::user_role
      ELSE 'aluno'::user_role
    END
  );
  
  -- Inserir novo perfil com o role correto
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    user_role
  );
  
  RETURN NEW;
END;
$function$;