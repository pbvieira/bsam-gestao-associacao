-- Atualizar a policy de INSERT para incluir 'administrador'
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;

CREATE POLICY "Users can create tasks"
ON tasks
FOR INSERT
TO public
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('administrador', 'coordenador', 'diretor', 'auxiliar')
  )
);