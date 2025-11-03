-- Drop existing UPDATE policy that doesn't include administrador
DROP POLICY IF EXISTS "Coordinators and directors can update students" ON students;

-- Create new UPDATE policy including administrador
CREATE POLICY "Authorized users can update students" 
ON students 
FOR UPDATE
USING (
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

-- Drop and recreate SELECT policy to ensure administrador is included
DROP POLICY IF EXISTS "Users can view students based on permissions" ON students;

CREATE POLICY "Users can view students based on permissions" 
ON students 
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = students.user_id
    )
  )
);