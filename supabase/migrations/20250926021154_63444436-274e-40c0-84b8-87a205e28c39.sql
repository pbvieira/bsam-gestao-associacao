-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Directors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create a security definer function to check if user is director/coordinator
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = check_user_id 
    AND role IN ('diretor', 'coordenador')
  );
$$;

-- Directors and coordinators can view all profiles using the function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_user(auth.uid()));

-- Clean up any duplicate permissions and recreate them properly
DELETE FROM public.permissions WHERE role = 'diretor';

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
  ('diretor', 'reports', 'read', true)
ON CONFLICT (role, module, action) DO UPDATE SET allowed = EXCLUDED.allowed;