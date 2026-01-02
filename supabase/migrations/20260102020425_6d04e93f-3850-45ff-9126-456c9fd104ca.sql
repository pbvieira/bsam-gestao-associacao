-- Tabela: Tipos de Renda
CREATE TABLE public.income_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#6366f1',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.income_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores podem gerenciar tipos de renda" 
ON public.income_types FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver tipos de renda ativos" 
ON public.income_types FOR SELECT 
USING (ativo = true);

-- Tabela: Tipos de Benefício
CREATE TABLE public.benefit_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#6366f1',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.benefit_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores podem gerenciar tipos de benefício" 
ON public.benefit_types FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver tipos de benefício ativos" 
ON public.benefit_types FOR SELECT 
USING (ativo = true);

-- Tabela: Categorias de Entrada (Livro Caixa)
CREATE TABLE public.cash_book_entry_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#10b981',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_book_entry_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores podem gerenciar categorias de entrada" 
ON public.cash_book_entry_categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver categorias de entrada ativas" 
ON public.cash_book_entry_categories FOR SELECT 
USING (ativo = true);

-- Tabela: Categorias de Saída (Livro Caixa)
CREATE TABLE public.cash_book_exit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#ef4444',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_book_exit_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administradores podem gerenciar categorias de saída" 
ON public.cash_book_exit_categories FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('coordenador', 'diretor', 'administrador')
));

CREATE POLICY "Todos podem ver categorias de saída ativas" 
ON public.cash_book_exit_categories FOR SELECT 
USING (ativo = true);

-- Triggers para updated_at
CREATE TRIGGER update_income_types_updated_at
  BEFORE UPDATE ON public.income_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_benefit_types_updated_at
  BEFORE UPDATE ON public.benefit_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_book_entry_categories_updated_at
  BEFORE UPDATE ON public.cash_book_entry_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_book_exit_categories_updated_at
  BEFORE UPDATE ON public.cash_book_exit_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Dados iniciais: Tipos de Renda
INSERT INTO public.income_types (nome, descricao, ordem) VALUES
('Salário', 'Rendimentos de emprego CLT', 0),
('Renda Autônoma', 'Trabalho informal ou freelance', 1),
('Aposentadoria', 'Benefício previdenciário', 2),
('Pensão Alimentícia', 'Pensão recebida de terceiros', 3),
('Aluguel', 'Renda de imóveis', 4),
('Outros', 'Outras fontes de renda', 5);

-- Dados iniciais: Tipos de Benefício
INSERT INTO public.benefit_types (nome, descricao, ordem) VALUES
('BPC/LOAS', 'Benefício de Prestação Continuada', 0),
('Bolsa Família', 'Programa de transferência de renda', 1),
('Auxílio Brasil', 'Programa de transferência de renda', 2),
('Seguro Desemprego', 'Benefício temporário', 3),
('Auxílio Doença', 'Benefício por incapacidade', 4),
('Pensão por Morte', 'Benefício previdenciário', 5),
('Outros', 'Outros benefícios', 6);

-- Dados iniciais: Categorias de Entrada
INSERT INTO public.cash_book_entry_categories (nome, descricao, cor, ordem) VALUES
('Família', 'Recebimentos de familiares', '#10b981', 0),
('Trabalho', 'Salários e rendimentos', '#059669', 1),
('Benefício', 'Benefícios sociais', '#047857', 2),
('Doação', 'Doações recebidas', '#065f46', 3),
('Outros', 'Outras entradas', '#064e3b', 4);

-- Dados iniciais: Categorias de Saída
INSERT INTO public.cash_book_exit_categories (nome, descricao, cor, ordem) VALUES
('Pessoal', 'Despesas pessoais', '#ef4444', 0),
('Transporte', 'Despesas com transporte', '#dc2626', 1),
('Saúde', 'Despesas médicas e farmácia', '#b91c1c', 2),
('Alimentação', 'Despesas com alimentação', '#991b1b', 3),
('Documentos', 'Taxas e documentação', '#7f1d1d', 4),
('Comunicação', 'Telefone e internet', '#f97316', 5),
('Lazer', 'Entretenimento e lazer', '#ea580c', 6),
('Outros', 'Outras saídas', '#c2410c', 7);