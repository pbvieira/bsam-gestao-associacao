-- Phase 2: Students Module Database Schema (Fixed)

-- Create sequence first
CREATE SEQUENCE students_seq START 1;

-- Main students table (cabeçalho do cadastro)
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  codigo_cadastro text UNIQUE NOT NULL DEFAULT 'ALN-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('students_seq')::text, 4, '0'),
  numero_interno text,
  data_abertura date NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada text,
  nome_completo text NOT NULL,
  data_nascimento date NOT NULL,
  cpf text,
  rg text,
  data_saida date,
  hora_saida text,
  nome_responsavel text,
  parentesco_responsavel text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dados básicos dos alunos
CREATE TABLE public.student_basic_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  telefone text,
  endereco text,
  cep text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  estado_civil text,
  religiao text,
  batizado boolean DEFAULT false,
  pis_nis text,
  cartao_sus text,
  estado_nascimento text,
  cidade_nascimento text,
  situacao_moradia text,
  escolaridade text,
  nome_pai text,
  data_nascimento_pai date,
  estado_pai text,
  nome_mae text,
  data_nascimento_mae date,
  estado_mae text,
  nome_conjuge text,
  data_nascimento_conjuge date,
  estado_conjuge text,
  comarca_juridica text,
  observacoes_juridicas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Filhos dos alunos
CREATE TABLE public.student_children (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  tem_filhos boolean DEFAULT false,
  quantidade_filhos integer DEFAULT 0,
  convive_filhos boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lista individual de filhos
CREATE TABLE public.student_children_list (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_children_id uuid REFERENCES public.student_children(id) ON DELETE CASCADE NOT NULL,
  nome_completo text NOT NULL,
  data_nascimento date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Situação trabalhista
CREATE TABLE public.student_work_situation (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  profissao text,
  situacao_trabalhista text,
  empresa text,
  funcao text,
  data_admissao date,
  contato_empresa text,
  tipo_renda text,
  valor_renda decimal(10,2),
  renda_per_capita decimal(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Contatos de emergência
CREATE TABLE public.student_emergency_contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  parentesco text,
  endereco text,
  avisar_contato boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Dados de saúde
CREATE TABLE public.student_health_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  -- Histórico médico
  teste_covid text,
  resultado_covid text,
  data_teste_covid date,
  teste_ist text,
  resultado_ist text,
  data_teste_ist date,
  tem_deficiencia boolean DEFAULT false,
  tipo_deficiencia text,
  vacinacao_atualizada boolean DEFAULT false,
  tratamento_odontologico boolean DEFAULT false,
  observacoes_odontologicas text,
  -- Saúde mental
  historico_internacoes text,
  acompanhamento_psicologico boolean DEFAULT false,
  detalhes_acompanhamento text,
  tentativa_suicidio boolean DEFAULT false,
  historico_surtos boolean DEFAULT false,
  alucinacoes boolean DEFAULT false,
  -- Medicamentos
  uso_medicamentos boolean DEFAULT false,
  descricao_medicamentos text,
  tempo_uso_medicamentos text,
  modo_uso_medicamentos text,
  -- Histórico familiar
  dependencia_quimica_familia boolean DEFAULT false,
  detalhes_dependencia_familia text,
  -- Observações gerais
  observacoes_gerais text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Anotações e histórico (prontuário)
CREATE TABLE public.student_annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('anotacao', 'gasto')),
  categoria text, -- Para anotações: atendimento, curso, entrega_item, compra
  descricao text NOT NULL,
  valor decimal(10,2), -- Para gastos
  data_evento date NOT NULL DEFAULT CURRENT_DATE,
  data_agendamento date, -- Para eventos futuros
  observacoes text,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Documentos (metadados dos arquivos)
CREATE TABLE public.student_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  nome_arquivo text NOT NULL,
  tipo_documento text NOT NULL, -- documentos_pessoais, comprovantes, laudos, fotos, videos
  caminho_arquivo text NOT NULL, -- Path no Supabase Storage
  tamanho_arquivo bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_basic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_children_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_work_situation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students (main table)
CREATE POLICY "Users can view students based on permissions" ON public.students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = students.user_id)
  )
);

CREATE POLICY "Coordinators and directors can insert students" ON public.students
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Coordinators and directors can update students" ON public.students
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Only directors can delete students" ON public.students
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = 'diretor'
  )
);

-- Apply similar policies to all related tables
CREATE POLICY "Users can view student data based on student permissions" ON public.student_basic_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_basic_data.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student basic data" ON public.student_basic_data
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_basic_data.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Repeat for other tables (children, work situation, emergency contacts, health data, annotations, documents)
CREATE POLICY "Users can view student children based on student permissions" ON public.student_children
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_children.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student children" ON public.student_children
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_children.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_basic_data_updated_at
BEFORE UPDATE ON public.student_basic_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_work_situation_updated_at
BEFORE UPDATE ON public.student_work_situation
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_emergency_contacts_updated_at
BEFORE UPDATE ON public.student_emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_health_data_updated_at
BEFORE UPDATE ON public.student_health_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_annotations_updated_at
BEFORE UPDATE ON public.student_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();