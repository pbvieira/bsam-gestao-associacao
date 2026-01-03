-- Create medication usage types auxiliary table
CREATE TABLE public.medication_usage_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_usage_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Todos podem ver tipos de uso ativos" ON public.medication_usage_types
FOR SELECT USING (ativo = true);

CREATE POLICY "Administradores podem gerenciar tipos de uso" ON public.medication_usage_types
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordenador', 'diretor', 'administrador')
  )
);

-- Insert default values
INSERT INTO public.medication_usage_types (nome, ordem, cor) VALUES
  ('Contínuo', 1, '#3b82f6'),
  ('Temporário', 2, '#f59e0b'),
  ('Eventual / conforme necessidade', 3, '#8b5cf6'),
  ('Preventivo / profilático', 4, '#10b981'),
  ('De emergência / pronto uso', 5, '#ef4444'),
  ('Sazonal', 6, '#06b6d4'),
  ('Paliativo', 7, '#ec4899'),
  ('Homeopático / alternativo', 8, '#84cc16'),
  ('Suspenso / interrompido', 9, '#6b7280');

-- Create student medications table
CREATE TABLE public.student_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nome_medicamento TEXT NOT NULL,
  principio_ativo TEXT,
  dosagem TEXT,
  forma_farmaceutica TEXT,
  tipo_uso_id UUID REFERENCES public.medication_usage_types(id),
  prescrito_por TEXT,
  data_inicio DATE,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_medications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authorized users can view student medications" ON public.student_medications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_medications.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student medications" ON public.student_medications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_medications.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  )
);

-- Create medication schedules table
CREATE TABLE public.medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.student_medications(id) ON DELETE CASCADE,
  horario TIME NOT NULL,
  frequencia TEXT NOT NULL DEFAULT 'diaria',
  dias_semana TEXT[],
  instrucoes TEXT,
  gerar_evento BOOLEAN NOT NULL DEFAULT false,
  setor_responsavel_id UUID REFERENCES public.setores(id),
  calendar_event_id UUID REFERENCES public.calendar_events(id),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authorized users can view medication schedules" ON public.medication_schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM student_medications sm
    JOIN students s ON s.id = sm.student_id
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE sm.id = medication_schedules.medication_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage medication schedules" ON public.medication_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM student_medications sm
    JOIN students s ON s.id = sm.student_id
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE sm.id = medication_schedules.medication_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_medication_usage_types_updated_at
  BEFORE UPDATE ON public.medication_usage_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_medications_updated_at
  BEFORE UPDATE ON public.student_medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_schedules_updated_at
  BEFORE UPDATE ON public.medication_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();