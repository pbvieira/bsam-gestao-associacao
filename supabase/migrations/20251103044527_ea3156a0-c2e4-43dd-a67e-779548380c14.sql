-- Drop existing policy
DROP POLICY IF EXISTS "Authorized users can manage student health data" ON student_health_data;

-- Create new policy with explicit USING and WITH CHECK
CREATE POLICY "Authorized users can manage student health data" 
ON student_health_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_health_data.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role, 
      'administrador'::user_role
    ])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_health_data.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role, 
      'administrador'::user_role
    ])
  )
);