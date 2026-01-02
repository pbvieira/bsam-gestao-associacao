-- Tabela de Áreas
CREATE TABLE public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#6366f1',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Setores
CREATE TABLE public.setores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para busca por área
CREATE INDEX idx_setores_area_id ON public.setores(area_id);

-- Habilitar RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;

-- Políticas para areas
CREATE POLICY "Todos podem ver áreas ativas" ON public.areas
  FOR SELECT USING (ativo = true);

CREATE POLICY "Administradores podem gerenciar áreas" ON public.areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('coordenador', 'diretor', 'administrador')
    )
  );

-- Políticas para setores
CREATE POLICY "Todos podem ver setores ativos" ON public.setores
  FOR SELECT USING (ativo = true);

CREATE POLICY "Administradores podem gerenciar setores" ON public.setores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('coordenador', 'diretor', 'administrador')
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setores_updated_at
  BEFORE UPDATE ON public.setores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dados iniciais: Áreas
INSERT INTO public.areas (nome, cor, ordem) VALUES
  ('Área Administrativa', '#8b5cf6', 1),
  ('Área Cidadania e Gestão Social', '#10b981', 2),
  ('Área Gestão Patrimonial', '#3b82f6', 3),
  ('Área Comunicação', '#f59e0b', 4);

-- Dados iniciais: Setores
WITH area_ids AS (
  SELECT id, nome FROM public.areas
)
INSERT INTO public.setores (area_id, nome, ordem)
SELECT 
  a.id,
  s.nome,
  s.ordem
FROM (
  SELECT 'Área Administrativa' as area_nome, 'Administrativo' as nome, 1 as ordem
  UNION ALL SELECT 'Área Administrativa', 'Compras', 2
  UNION ALL SELECT 'Área Administrativa', 'Cozinha', 3
  UNION ALL SELECT 'Área Administrativa', 'Copa padaria', 4
  UNION ALL SELECT 'Área Administrativa', 'Copa', 5
  UNION ALL SELECT 'Área Administrativa', 'Fruteira', 6
  UNION ALL SELECT 'Área Administrativa', 'Horta', 7
  UNION ALL SELECT 'Área Administrativa', 'Apoio (limpeza)', 8
  UNION ALL SELECT 'Área Administrativa', 'Reciclado', 9
  UNION ALL SELECT 'Área Administrativa', 'Transporte', 10
  UNION ALL SELECT 'Área Cidadania e Gestão Social', 'Atendimento Social', 1
  UNION ALL SELECT 'Área Cidadania e Gestão Social', 'Templo', 2
  UNION ALL SELECT 'Área Cidadania e Gestão Social', 'Biblioteca', 3
  UNION ALL SELECT 'Área Gestão Patrimonial', 'Almoxarifado', 1
  UNION ALL SELECT 'Área Gestão Patrimonial', 'Manutenção', 2
  UNION ALL SELECT 'Área Gestão Patrimonial', 'Obras', 3
  UNION ALL SELECT 'Área Gestão Patrimonial', 'Segurança patrimonial', 4
) s
JOIN area_ids a ON a.nome = s.area_nome;