-- Adicionar campo quantidade_pessoas_residencia na tabela existente
ALTER TABLE public.student_work_situation 
ADD COLUMN IF NOT EXISTS quantidade_pessoas_residencia integer DEFAULT 1;

-- Criar tabela student_income_list (Lista de Rendas)
CREATE TABLE public.student_income_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tipo_renda text NOT NULL,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS para student_income_list
ALTER TABLE public.student_income_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage student income list"
  ON public.student_income_list FOR ALL
  USING (EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_income_list.student_id 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  ));

CREATE POLICY "Users can view student income list"
  ON public.student_income_list FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_income_list.student_id 
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  ));

-- Criar tabela student_benefits_list (Lista de Benefícios)
CREATE TABLE public.student_benefits_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  tipo_beneficio text NOT NULL,
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS para student_benefits_list
ALTER TABLE public.student_benefits_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage student benefits list"
  ON public.student_benefits_list FOR ALL
  USING (EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_benefits_list.student_id 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  ));

CREATE POLICY "Users can view student benefits list"
  ON public.student_benefits_list FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_benefits_list.student_id 
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador') OR p.user_id = s.user_id)
  ));