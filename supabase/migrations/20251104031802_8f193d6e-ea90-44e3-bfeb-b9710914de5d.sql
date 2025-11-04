-- Create inventory_categories table
CREATE TABLE public.inventory_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view active categories
CREATE POLICY "Todos podem ver categorias ativas"
ON public.inventory_categories
FOR SELECT
USING (ativo = true);

-- RLS Policy: Admins can manage all categories
CREATE POLICY "Administradores podem gerenciar categorias"
ON public.inventory_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('coordenador', 'diretor', 'administrador')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_inventory_categories_updated_at
BEFORE UPDATE ON public.inventory_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.inventory_categories (nome, ordem, cor, ativo) VALUES
  ('Alimentos', 1, '#10b981', true),
  ('Roupas', 2, '#3b82f6', true),
  ('Medicamentos', 3, '#ef4444', true),
  ('Materiais de Limpeza', 4, '#06b6d4', true),
  ('Material Escolar', 5, '#f59e0b', true),
  ('Materiais de Construção', 6, '#8b5cf6', true),
  ('Equipamentos', 7, '#6b7280', true),
  ('Outros', 8, '#84cc16', true);