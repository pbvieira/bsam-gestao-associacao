-- Create student_stays table for stay history
CREATE TABLE public.student_stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  data_entrada date NOT NULL,
  hora_entrada text,
  data_saida date NOT NULL,
  hora_saida text,
  motivo_saida text,
  observacoes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for student lookups
CREATE INDEX idx_student_stays_student_id ON public.student_stays(student_id);

-- Enable RLS
ALTER TABLE public.student_stays ENABLE ROW LEVEL SECURITY;

-- Policy for managing stays (coordinators, directors, auxiliaries, admins)
CREATE POLICY "Authorized users can manage student stays"
  ON public.student_stays FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_stays.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  ));

-- Policy for viewing stays
CREATE POLICY "Users can view student stays"
  ON public.student_stays FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_stays.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  ));

-- Trigger for updated_at
CREATE TRIGGER update_student_stays_updated_at
  BEFORE UPDATE ON public.student_stays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();