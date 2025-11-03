-- Drop old INSERT policy that doesn't include administrador
DROP POLICY IF EXISTS "Coordinators and directors can insert students" ON students;

-- Create new INSERT policy including administrador role
CREATE POLICY "Authorized users can insert students" 
ON students 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);