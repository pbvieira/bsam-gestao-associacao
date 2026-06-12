
-- Insert configurable setting
INSERT INTO public.system_settings (key, value, description)
VALUES ('pendency_auto_archive_days', '30', 'Dias para arquivar automaticamente pendências concluídas ou rejeitadas')
ON CONFLICT (key) DO NOTHING;

-- Update get_board_pendencies to read setting dynamically
CREATE OR REPLACE FUNCTION public.get_board_pendencies(_board_id uuid)
 RETURNS SETOF pendencies
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _days int;
BEGIN
  SELECT COALESCE(NULLIF(value, '')::int, 30) INTO _days
  FROM public.system_settings WHERE key = 'pendency_auto_archive_days';
  _days := COALESCE(_days, 30);

  RETURN QUERY
  SELECT p.*
  FROM public.pendencies p
  JOIN public.pendency_columns c ON c.id = p.column_id
  WHERE p.board_id = _board_id
    AND p.arquivada_em IS NULL
    AND NOT (
      (c.kind = 'done'     AND p.data_entrega IS NOT NULL AND p.data_entrega < now() - (_days || ' days')::interval)
      OR
      (c.kind = 'rejected' AND p.data_aceite  IS NOT NULL AND p.data_aceite  < now() - (_days || ' days')::interval)
    )
  ORDER BY p.posicao;
END;
$function$;

-- Update get_archived_pendencies to read setting dynamically
CREATE OR REPLACE FUNCTION public.get_archived_pendencies(_board_id uuid)
 RETURNS TABLE(id uuid, board_id uuid, column_id uuid, posicao integer, titulo text, descricao text, solicitante_id uuid, responsavel_id uuid, area_id uuid, setor_id uuid, categoria_id uuid, prioridade pendency_priority, status_aceite pendency_acceptance, data_aceite timestamp with time zone, motivo_rejeicao text, prazo timestamp with time zone, data_entrega timestamp with time zone, dep_setor_id uuid, dep_responsavel_id uuid, dep_descricao text, esforco_estimado numeric, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, arquivada_em timestamp with time zone, arquivada_por uuid, arquivamento_tipo text, arquivado_efetivo_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _days int;
BEGIN
  SELECT COALESCE(NULLIF(value, '')::int, 30) INTO _days
  FROM public.system_settings WHERE key = 'pendency_auto_archive_days';
  _days := COALESCE(_days, 30);

  RETURN QUERY
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
        WHEN c.kind = 'done'     AND p.data_entrega IS NOT NULL THEN p.data_entrega + (_days || ' days')::interval
        WHEN c.kind = 'rejected' AND p.data_aceite  IS NOT NULL THEN p.data_aceite  + (_days || ' days')::interval
      END
    ) AS arquivado_efetivo_em
  FROM public.pendencies p
  JOIN public.pendency_columns c ON c.id = p.column_id
  WHERE p.board_id = _board_id
    AND (
      p.arquivada_em IS NOT NULL
      OR (c.kind = 'done'     AND p.data_entrega IS NOT NULL AND p.data_entrega < now() - (_days || ' days')::interval)
      OR (c.kind = 'rejected' AND p.data_aceite  IS NOT NULL AND p.data_aceite  < now() - (_days || ' days')::interval)
    )
  ORDER BY 29 DESC NULLS LAST;
END;
$function$;
