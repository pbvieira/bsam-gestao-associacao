-- Create filiation_status table for parent filiation states
CREATE TABLE public.filiation_status (
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
ALTER TABLE public.filiation_status ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active statuses
CREATE POLICY "Todos podem ver status ativos"
ON public.filiation_status
FOR SELECT
USING (ativo = true);

-- Policy: Administrators can manage statuses
CREATE POLICY "Administradores podem gerenciar status"
ON public.filiation_status
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordenador', 'diretor', 'administrador')
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_filiation_status_updated_at
  BEFORE UPDATE ON public.filiation_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial values
INSERT INTO public.filiation_status (nome, ordem) VALUES
  ('Vivo(a) e conhecido(a)', 1),
  ('Falecido(a)', 2),
  ('Desconhecido(a)', 3),
  ('Adotivo(a)', 4),
  ('Biológico(a)', 5),
  ('Socioafetivo(a)', 6),
  ('Ausente / sem contato', 7),
  ('Não declarado(a) no registro', 8);