-- Criar tabela de tipos de doenças
CREATE TABLE public.disease_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  informacao_adicional TEXT,
  cor TEXT NOT NULL DEFAULT '#ef4444',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de tipos de deficiência
CREATE TABLE public.disability_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  informacao_adicional TEXT,
  cor TEXT NOT NULL DEFAULT '#8b5cf6',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de doenças do aluno
CREATE TABLE public.student_diseases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  disease_type_id UUID NOT NULL REFERENCES public.disease_types(id) ON DELETE CASCADE,
  possui BOOLEAN NOT NULL,
  data_diagnostico DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, disease_type_id)
);

-- Criar tabela de deficiências do aluno
CREATE TABLE public.student_disabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  disability_type_id UUID NOT NULL REFERENCES public.disability_types(id) ON DELETE CASCADE,
  possui BOOLEAN NOT NULL,
  data_diagnostico DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, disability_type_id)
);

-- Enable RLS
ALTER TABLE public.disease_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disability_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_disabilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disease_types
CREATE POLICY "Administradores podem gerenciar tipos de doenças"
ON public.disease_types FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver tipos de doenças ativos"
ON public.disease_types FOR SELECT
USING (ativo = true);

-- RLS Policies for disability_types
CREATE POLICY "Administradores podem gerenciar tipos de deficiências"
ON public.disability_types FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver tipos de deficiências ativos"
ON public.disability_types FOR SELECT
USING (ativo = true);

-- RLS Policies for student_diseases
CREATE POLICY "Authorized users can manage student diseases"
ON public.student_diseases FOR ALL
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE s.id = student_diseases.student_id
  AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
));

CREATE POLICY "Users can view student diseases based on permissions"
ON public.student_diseases FOR SELECT
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE s.id = student_diseases.student_id
  AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
));

-- RLS Policies for student_disabilities
CREATE POLICY "Authorized users can manage student disabilities"
ON public.student_disabilities FOR ALL
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE s.id = student_disabilities.student_id
  AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
));

CREATE POLICY "Users can view student disabilities based on permissions"
ON public.student_disabilities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE s.id = student_disabilities.student_id
  AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
));

-- Triggers for updated_at
CREATE TRIGGER update_disease_types_updated_at
BEFORE UPDATE ON public.disease_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disability_types_updated_at
BEFORE UPDATE ON public.disability_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_diseases_updated_at
BEFORE UPDATE ON public.student_diseases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_disabilities_updated_at
BEFORE UPDATE ON public.student_disabilities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais de doenças
INSERT INTO public.disease_types (nome, ordem, cor) VALUES
('HIV', 1, '#ef4444'),
('Sífilis', 2, '#f97316'),
('Hepatite B', 3, '#eab308'),
('Hepatite C', 4, '#84cc16');

-- Inserir dados iniciais de deficiências
INSERT INTO public.disability_types (nome, ordem, cor) VALUES
('Deficiência Física', 1, '#8b5cf6'),
('Deficiência Visual', 2, '#6366f1'),
('Deficiência Auditiva', 3, '#3b82f6'),
('Deficiência Intelectual', 4, '#0ea5e9'),
('Deficiência Múltipla', 5, '#14b8a6'),
('Deficiência Psicossocial / Mental', 6, '#10b981'),
('Deficiência Neurológica', 7, '#f59e0b');