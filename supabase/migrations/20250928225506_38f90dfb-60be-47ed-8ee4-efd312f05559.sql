-- Drop the existing policy that excludes 'administrador'
DROP POLICY IF EXISTS "Administradores podem gerenciar categorias" ON public.annotation_categories;

-- Create the corrected policy that includes 'administrador' role
CREATE POLICY "Administradores podem gerenciar categorias" 
ON public.annotation_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('coordenador', 'diretor', 'administrador')
  )
);