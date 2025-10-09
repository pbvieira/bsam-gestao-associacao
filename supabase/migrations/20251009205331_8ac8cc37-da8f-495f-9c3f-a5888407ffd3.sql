-- Drop existing policy that only allows directors
DROP POLICY IF EXISTS "Only directors can delete students" ON students;

-- Create new policy allowing both directors and administrators
CREATE POLICY "Directors and administrators can delete students"
ON students
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('diretor'::user_role, 'administrador'::user_role)
  )
);