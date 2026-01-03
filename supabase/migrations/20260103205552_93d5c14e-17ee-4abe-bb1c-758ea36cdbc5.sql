-- Criar tabela auxiliar de tipos de vacinas
CREATE TABLE public.vaccine_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  informacao_adicional TEXT,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de vacinas do aluno
CREATE TABLE public.student_vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  vaccine_type_id UUID NOT NULL REFERENCES public.vaccine_types(id) ON DELETE CASCADE,
  tomou BOOLEAN NOT NULL,
  data_vacinacao DATE,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, vaccine_type_id)
);

-- Habilitar RLS
ALTER TABLE public.vaccine_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_vaccines ENABLE ROW LEVEL SECURITY;

-- Policies para vaccine_types
CREATE POLICY "Administradores podem gerenciar tipos de vacinas"
ON public.vaccine_types
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid()
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver tipos de vacinas ativos"
ON public.vaccine_types
FOR SELECT
USING (ativo = true);

-- Policies para student_vaccines
CREATE POLICY "Authorized users can manage student vaccines"
ON public.student_vaccines
FOR ALL
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE s.id = student_vaccines.student_id
  AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
));

CREATE POLICY "Users can view student vaccines based on permissions"
ON public.student_vaccines
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM students s
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE s.id = student_vaccines.student_id
  AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
));

-- Trigger para updated_at
CREATE TRIGGER update_vaccine_types_updated_at
  BEFORE UPDATE ON public.vaccine_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_vaccines_updated_at
  BEFORE UPDATE ON public.student_vaccines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir vacinas iniciais
INSERT INTO public.vaccine_types (nome, descricao, informacao_adicional, ordem) VALUES
  ('Hepatite B', 'Proteção contra hepatite B', NULL, 1),
  ('Dupla Adulto (dT)', 'Difteria e tétano', NULL, 2),
  ('Tríplice Viral (SCR)', 'Sarampo, caxumba e rubéola', NULL, 3),
  ('Febre Amarela', 'Proteção contra febre amarela', NULL, 4),
  ('Influenza', 'Gripe', NULL, 5),
  ('COVID-19', 'Coronavírus', NULL, 6),
  ('HPV', 'Papilomavírus humano', 'Recomendado para adultos até 45 anos', 7),
  ('Hepatite A', 'Proteção contra hepatite A', 'Em situações específicas', 8),
  ('Meningocócica ACWY', 'Meningite', 'Grupos prioritários e reforço até 60 anos', 9),
  ('Pneumocócica 23-valente', 'Pneumonia', 'Para idosos e grupos de risco', 10),
  ('Varicela', 'Catapora', 'Se não vacinado na infância', 11);