-- Fix permissions table RLS policy to include administrators
DROP POLICY IF EXISTS "Only directors can manage permissions" ON public.permissions;

-- Create new policy that allows both directors and administrators to manage permissions
CREATE POLICY "Directors and administrators can manage permissions" 
ON public.permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('diretor'::user_role, 'administrador'::user_role)
  )
);