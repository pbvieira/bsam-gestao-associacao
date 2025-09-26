-- Update the handle_new_user function to make the first user a director
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  profile_count INTEGER;
BEGIN
  -- Check if this is the first user (no existing profiles)
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  -- Insert new profile
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    CASE 
      WHEN profile_count = 0 THEN 'diretor'::user_role
      ELSE 'aluno'::user_role
    END
  );
  
  RETURN NEW;
END;
$function$;

-- Create default permissions for all roles if they don't exist
INSERT INTO public.permissions (role, module, action, allowed) VALUES
  -- Director permissions (full access)
  ('diretor', 'dashboard', 'read', true),
  ('diretor', 'students', 'read', true),
  ('diretor', 'students', 'write', true),
  ('diretor', 'students', 'delete', true),
  ('diretor', 'users', 'read', true),
  ('diretor', 'users', 'write', true),
  ('diretor', 'inventory', 'read', true),
  ('diretor', 'inventory', 'write', true),
  ('diretor', 'reports', 'read', true),
  
  -- Coordinator permissions
  ('coordenador', 'dashboard', 'read', true),
  ('coordenador', 'students', 'read', true),
  ('coordenador', 'students', 'write', true),
  ('coordenador', 'users', 'read', true),
  ('coordenador', 'inventory', 'read', true),
  ('coordenador', 'inventory', 'write', true),
  ('coordenador', 'reports', 'read', true),
  
  -- Assistant permissions
  ('auxiliar', 'dashboard', 'read', true),
  ('auxiliar', 'students', 'read', true),
  ('auxiliar', 'students', 'write', true),
  ('auxiliar', 'inventory', 'read', true),
  ('auxiliar', 'reports', 'read', true),
  
  -- Student permissions (limited)
  ('aluno', 'dashboard', 'read', true)
ON CONFLICT (role, module, action) DO NOTHING;