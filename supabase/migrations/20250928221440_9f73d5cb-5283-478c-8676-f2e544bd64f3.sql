-- FASE 1: Limpeza da base de dados - Remoção de campos desnecessários

-- Remove colunas desnecessárias da tabela student_annotations
ALTER TABLE public.student_annotations 
DROP COLUMN IF EXISTS data_agendamento,
DROP COLUMN IF EXISTS observacoes,
DROP COLUMN IF EXISTS valor;

-- Remove constraint de tipo que inclui 'gasto'
ALTER TABLE public.student_annotations 
DROP CONSTRAINT IF EXISTS student_annotations_tipo_check;

-- Adiciona novo constraint apenas para 'anotacao'
ALTER TABLE public.student_annotations 
ADD CONSTRAINT student_annotations_tipo_check 
CHECK (tipo = 'anotacao');

-- FASE 2: Criação da tabela de categorias de anotações
CREATE TABLE public.annotation_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  descricao text,
  cor text DEFAULT '#6366f1',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_annotation_categories_updated_at
    BEFORE UPDATE ON public.annotation_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS na tabela de categorias
ALTER TABLE public.annotation_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para annotation_categories
CREATE POLICY "Todos podem ver categorias ativas" 
ON public.annotation_categories 
FOR SELECT 
USING (ativo = true);

CREATE POLICY "Administradores podem gerenciar categorias" 
ON public.annotation_categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('coordenador', 'diretor')
));

-- Inserir categorias padrão
INSERT INTO public.annotation_categories (nome, descricao, cor, ordem) VALUES
('Atendimento', 'Registros de atendimentos realizados', '#10b981', 1),
('Curso', 'Informações sobre cursos e treinamentos', '#3b82f6', 2),
('Entrega de Item', 'Registros de entrega de materiais/itens', '#f59e0b', 3),
('Compra', 'Registros de compras realizadas', '#ef4444', 4),
('Outros', 'Outras anotações gerais', '#6b7280', 5);

-- Atualizar dados existentes para usar as novas categorias
UPDATE public.student_annotations 
SET categoria = 'Atendimento'
WHERE categoria = 'atendimento';

UPDATE public.student_annotations 
SET categoria = 'Curso'
WHERE categoria = 'curso';

UPDATE public.student_annotations 
SET categoria = 'Entrega de Item'
WHERE categoria = 'entrega_item';

UPDATE public.student_annotations 
SET categoria = 'Compra'
WHERE categoria = 'compra';

UPDATE public.student_annotations 
SET categoria = 'Outros'
WHERE categoria = 'outros' OR categoria IS NULL;