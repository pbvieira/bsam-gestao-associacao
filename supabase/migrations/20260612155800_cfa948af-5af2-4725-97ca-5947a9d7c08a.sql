
ALTER TABLE public.pendencies
  ADD COLUMN IF NOT EXISTS arquivada_em timestamptz NULL,
  ADD COLUMN IF NOT EXISTS arquivada_por uuid NULL;

CREATE INDEX IF NOT EXISTS idx_pendencies_arquivada_em ON public.pendencies(arquivada_em);
CREATE INDEX IF NOT EXISTS idx_pendencies_board_arquivada ON public.pendencies(board_id, arquivada_em);

-- Função: arquiva automaticamente pendências em done/rejected há mais de 30 dias
CREATE OR REPLACE FUNCTION public.archive_old_pendencies(_board_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH targets AS (
    SELECT p.id
    FROM public.pendencies p
    JOIN public.pendency_columns c ON c.id = p.column_id
    WHERE p.arquivada_em IS NULL
      AND (_board_id IS NULL OR p.board_id = _board_id)
      AND (
        (c.kind = 'done' AND p.data_entrega IS NOT NULL AND p.data_entrega < now() - interval '30 days')
        OR
        (c.kind = 'rejected' AND p.data_aceite IS NOT NULL AND p.data_aceite < now() - interval '30 days')
      )
  )
  UPDATE public.pendencies
  SET arquivada_em = now(),
      arquivada_por = auth.uid()
  WHERE id IN (SELECT id FROM targets);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Função: restaurar uma pendência arquivada para primeira coluna 'open' do quadro
CREATE OR REPLACE FUNCTION public.restore_pendency(_pendency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_board uuid;
  v_target_col uuid;
BEGIN
  SELECT board_id INTO v_board FROM public.pendencies WHERE id = _pendency_id;
  IF v_board IS NULL THEN
    RAISE EXCEPTION 'Pendência não encontrada';
  END IF;

  SELECT id INTO v_target_col
  FROM public.pendency_columns
  WHERE board_id = v_board AND kind = 'open'
  ORDER BY posicao
  LIMIT 1;

  IF v_target_col IS NULL THEN
    RAISE EXCEPTION 'Nenhuma coluna aberta encontrada no quadro';
  END IF;

  UPDATE public.pendencies
  SET arquivada_em = NULL,
      arquivada_por = NULL,
      column_id = v_target_col,
      data_entrega = NULL,
      motivo_rejeicao = NULL,
      status_aceite = 'pendente',
      data_aceite = NULL
  WHERE id = _pendency_id;
END;
$$;

-- Atualizar a RPC de overview para ignorar pendências arquivadas nas métricas
CREATE OR REPLACE FUNCTION public.get_pendency_boards_overview(_include_archived boolean DEFAULT false)
RETURNS TABLE(id uuid, nome text, descricao text, cor text, is_default boolean, ativo boolean, arquivado_em timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, is_favorite boolean, total_abertas bigint, total_atrasadas bigint, total_concluidas_mes bigint, ultimo_movimento timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
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
        AND p.arquivada_em IS NULL
    ), 0) AS total_abertas,
    COALESCE((
      SELECT COUNT(*) FROM public.pendencies p
      JOIN public.pendency_columns c ON c.id = p.column_id
      WHERE p.board_id = b.id
        AND c.kind IN ('open','blocked')
        AND p.prazo IS NOT NULL
        AND p.prazo < now()
        AND p.data_entrega IS NULL
        AND p.arquivada_em IS NULL
    ), 0) AS total_atrasadas,
    COALESCE((
      SELECT COUNT(*) FROM public.pendencies p
      JOIN public.pendency_columns c ON c.id = p.column_id
      WHERE p.board_id = b.id
        AND c.kind = 'done'
        AND p.data_entrega >= date_trunc('month', now())
        AND p.arquivada_em IS NULL
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
