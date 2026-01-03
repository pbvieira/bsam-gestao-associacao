-- Criar tabela para histórico de internações
CREATE TABLE public.student_hospitalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  data_entrada DATE NOT NULL,
  data_saida DATE,
  tipo_internacao TEXT NOT NULL,
  local TEXT,
  motivo TEXT NOT NULL,
  diagnostico TEXT,
  medico_responsavel TEXT,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para prontuário médico
CREATE TABLE public.student_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  data_atendimento DATE NOT NULL,
  tipo_atendimento TEXT NOT NULL,
  especialidade TEXT,
  profissional TEXT,
  local TEXT,
  motivo TEXT,
  diagnostico TEXT,
  prescricao TEXT,
  observacoes TEXT,
  data_retorno DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_hospitalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_medical_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_hospitalizations
CREATE POLICY "Authorized users can manage student hospitalizations"
ON public.student_hospitalizations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_hospitalizations.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  )
);

CREATE POLICY "Users can view student hospitalizations based on permissions"
ON public.student_hospitalizations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_hospitalizations.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  )
);

-- RLS policies for student_medical_records
CREATE POLICY "Authorized users can manage student medical records"
ON public.student_medical_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_medical_records.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  )
);

CREATE POLICY "Users can view student medical records based on permissions"
ON public.student_medical_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_medical_records.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  )
);

-- Triggers for updated_at
CREATE TRIGGER update_student_hospitalizations_updated_at
BEFORE UPDATE ON public.student_hospitalizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_medical_records_updated_at
BEFORE UPDATE ON public.student_medical_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();