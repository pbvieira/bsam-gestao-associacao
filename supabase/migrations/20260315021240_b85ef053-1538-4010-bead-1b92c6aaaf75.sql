-- Drop existing policies
DROP POLICY IF EXISTS "Users can view student medical records based on permissions" ON public.student_medical_records;
DROP POLICY IF EXISTS "Authorized users can manage student medical records" ON public.student_medical_records;

-- New SELECT policy: psychological records only visible to creator
CREATE POLICY "Users can view student medical records based on permissions"
ON public.student_medical_records
FOR SELECT
USING (
  CASE 
    WHEN tipo_atendimento = 'consulta_psicologica' THEN created_by = auth.uid()
    ELSE EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE s.id = student_medical_records.student_id
      AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
    )
  END
);

-- New ALL policy: psychological records only manageable by creator
CREATE POLICY "Authorized users can manage student medical records"
ON public.student_medical_records
FOR ALL
USING (
  CASE
    WHEN tipo_atendimento = 'consulta_psicologica' THEN created_by = auth.uid()
    ELSE EXISTS (
      SELECT 1 FROM students s
      JOIN profiles p ON p.user_id = auth.uid()
      WHERE s.id = student_medical_records.student_id
      AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
    )
  END
);