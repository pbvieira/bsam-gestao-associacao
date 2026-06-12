
CREATE OR REPLACE FUNCTION public.get_board_pendencies(_board_id uuid)
RETURNS SETOF public.pendencies
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.*
  FROM public.pendencies p
  JOIN public.pendency_columns c ON c.id = p.column_id
  WHERE p.board_id = _board_id
    AND p.arquivada_em IS NULL
    AND NOT (
      (c.kind = 'done'     AND p.data_entrega IS NOT NULL AND p.data_entrega < now() - interval '30 days')
      OR
      (c.kind = 'rejected' AND p.data_aceite  IS NOT NULL AND p.data_aceite  < now() - interval '30 days')
    )
  ORDER BY p.posicao;
$$;

CREATE OR REPLACE FUNCTION public.get_archived_pendencies(_board_id uuid)
RETURNS TABLE (
  id uuid,
  board_id uuid,
  column_id uuid,
  posicao integer,
  titulo text,
  descricao text,
  solicitante_id uuid,
  responsavel_id uuid,
  area_id uuid,
  setor_id uuid,
  categoria_id uuid,
  prioridade pendency_priority,
  status_aceite pendency_acceptance,
  data_aceite timestamptz,
  motivo_rejeicao text,
  prazo timestamptz,
  data_entrega timestamptz,
  dep_setor_id uuid,
  dep_responsavel_id uuid,
  dep_descricao text,
  esforco_estimado numeric,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  arquivada_em timestamptz,
  arquivada_por uuid,
  arquivamento_tipo text,
  arquivado_efetivo_em timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id, p.board_id, p.column_id, p.posicao, p.titulo, p.descricao,
    p.solicitante_id, p.responsavel_id, p.area_id, p.setor_id, p.categoria_id,
    p.prioridade, p.status_aceite, p.data_aceite, p.motivo_rejeicao,
    p.prazo, p.data_entrega, p.dep_setor_id, p.dep_responsavel_id, p.dep_descricao,
    p.esforco_estimado, p.created_by, p.created_at, p.updated_at,
    p.arquivada_em, p.arquivada_por,
    CASE WHEN p.arquivada_em IS NOT NULL THEN 'manual' ELSE 'automatico' END AS arquivamento_tipo,
    COALESCE(
      p.arquivada_em,
      CASE
        WHEN c.kind = 'done'     AND p.data_entrega IS NOT NULL THEN p.data_entrega + interval '30 days'
        WHEN c.kind = 'rejected' AND p.data_aceite  IS NOT NULL THEN p.data_aceite  + interval '30 days'
      END
    ) AS arquivado_efetivo_em
  FROM public.pendencies p
  JOIN public.pendency_columns c ON c.id = p.column_id
  WHERE p.board_id = _board_id
    AND (
      p.arquivada_em IS NOT NULL
      OR (c.kind = 'done'     AND p.data_entrega IS NOT NULL AND p.data_entrega < now() - interval '30 days')
      OR (c.kind = 'rejected' AND p.data_aceite  IS NOT NULL AND p.data_aceite  < now() - interval '30 days')
    )
  ORDER BY arquivado_efetivo_em DESC NULLS LAST;
$$;
