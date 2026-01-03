-- Create work_situations table for auxiliary work status data
CREATE TABLE public.work_situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text NOT NULL DEFAULT '#6366f1',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_situations ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can see active work situations
CREATE POLICY "Todos podem ver situações trabalhistas ativas"
ON public.work_situations
FOR SELECT
USING (ativo = true);

-- Policy: Admins can manage work situations
CREATE POLICY "Administradores podem gerenciar situações trabalhistas"
ON public.work_situations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('coordenador', 'diretor', 'administrador')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_work_situations_updated_at
BEFORE UPDATE ON public.work_situations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial data
INSERT INTO public.work_situations (nome, ordem) VALUES
('Empregado com carteira assinada', 1),
('Servidor público', 2),
('Empregado doméstico com carteira assinada', 3),
('Militar', 4),
('Autônomo / profissional liberal', 5),
('Microempreendedor Individual (MEI)', 6),
('Trabalhador informal ("bico")', 7),
('Desempregado', 8),
('Aposentado', 9),
('Pensionista', 10),
('Dona(o) de casa', 11),
('Afastado por motivo de saúde / benefício INSS', 12),
('Recluso / em cumprimento de pena', 13);