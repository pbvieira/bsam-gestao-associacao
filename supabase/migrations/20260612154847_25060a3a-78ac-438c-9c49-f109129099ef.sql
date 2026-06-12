
-- Campos de arquivamento em pendency_boards
ALTER TABLE public.pendency_boards
  ADD COLUMN IF NOT EXISTS arquivado_em timestamptz NULL,
  ADD COLUMN IF NOT EXISTS arquivado_por uuid NULL;

-- Tabela de favoritos por usuário
CREATE TABLE IF NOT EXISTS public.pendency_board_favorites (
  board_id uuid NOT NULL REFERENCES public.pendency_boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.pendency_board_favorites TO authenticated;
GRANT ALL ON public.pendency_board_favorites TO service_role;

ALTER TABLE public.pendency_board_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus próprios favoritos"
  ON public.pendency_board_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC para visão geral dos quadros com métricas agregadas
CREATE OR REPLACE FUNCTION public.get_pendency_boards_overview(_include_archived boolean DEFAULT false)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao text,
  cor text,
  is_default boolean,
  ativo boolean,
  arquivado_em timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  is_favorite boolean,
  total_abertas bigint,
  total_atrasadas bigint,
  total_concluidas_mes bigint,
  ultimo_movimento timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    b.id,
    b.nome,
    b.descricao,
    b.cor,
    b.is_default,
    b.ativo,
    b.arquivado_em,
    b.created_at,
    b.updated_at,
    EXISTS (
      SELECT 1 FROM public.pendency_board_favorites f
      WHERE f.board_id = b.id AND f.user_id = auth.uid()
    ) AS is_favorite,
    COALESCE((
      SELECT COUNT(*) FROM public.pendencies p
      JOIN public.pendency_columns c ON c.id = p.column_id
      WHERE p.board_id = b.id AND c.kind IN ('open','blocked')
    ), 0) AS total_abertas,
    COALESCE((
      SELECT COUNT(*) FROM public.pendencies p
      JOIN public.pendency_columns c ON c.id = p.column_id
      WHERE p.board_id = b.id
        AND c.kind IN ('open','blocked')
        AND p.prazo IS NOT NULL
        AND p.prazo < now()
        AND p.data_entrega IS NULL
    ), 0) AS total_atrasadas,
    COALESCE((
      SELECT COUNT(*) FROM public.pendencies p
      JOIN public.pendency_columns c ON c.id = p.column_id
      WHERE p.board_id = b.id
        AND c.kind = 'done'
        AND p.data_entrega >= date_trunc('month', now())
    ), 0) AS total_concluidas_mes,
    GREATEST(
      b.updated_at,
      COALESCE((SELECT MAX(p.updated_at) FROM public.pendencies p WHERE p.board_id = b.id), b.updated_at)
    ) AS ultimo_movimento
  FROM public.pendency_boards b
  WHERE (_include_archived OR b.arquivado_em IS NULL)
    AND b.ativo = true
  ORDER BY
    EXISTS (SELECT 1 FROM public.pendency_board_favorites f WHERE f.board_id = b.id AND f.user_id = auth.uid()) DESC,
    b.is_default DESC,
    b.nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_pendency_boards_overview(boolean) TO authenticated;
