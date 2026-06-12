-- Atualiza business rules para usar a coluna como fonte única de status
CREATE OR REPLACE FUNCTION public.pendency_business_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_kind public.pendency_column_kind;
  v_old_kind public.pendency_column_kind;
  v_blocked_col uuid;
BEGIN
  -- Resolver kind da nova coluna
  IF NEW.column_id IS NOT NULL THEN
    SELECT kind INTO v_new_kind FROM public.pendency_columns WHERE id = NEW.column_id;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.column_id IS NOT NULL THEN
    SELECT kind INTO v_old_kind FROM public.pendency_columns WHERE id = OLD.column_id;
  END IF;

  -- Dependência preenchida (transição) → move para coluna 'blocked' se existir
  IF TG_OP = 'UPDATE'
     AND (NEW.dep_setor_id IS NOT NULL OR NEW.dep_responsavel_id IS NOT NULL)
     AND (OLD.dep_setor_id IS NULL AND OLD.dep_responsavel_id IS NULL)
  THEN
    SELECT id INTO v_blocked_col FROM public.pendency_columns
      WHERE board_id = NEW.board_id AND kind = 'blocked'
      ORDER BY posicao LIMIT 1;
    IF v_blocked_col IS NOT NULL THEN
      NEW.column_id := v_blocked_col;
      SELECT kind INTO v_new_kind FROM public.pendency_columns WHERE id = NEW.column_id;
    END IF;
  END IF;

  -- Derivar status_aceite a partir do kind da coluna
  IF v_new_kind = 'rejected' THEN
    IF NEW.motivo_rejeicao IS NULL OR length(trim(NEW.motivo_rejeicao)) = 0 THEN
      RAISE EXCEPTION 'Motivo da rejeição é obrigatório ao mover para uma coluna de rejeição.';
    END IF;
    NEW.status_aceite := 'rejeitada';
    IF NEW.data_aceite IS NULL THEN NEW.data_aceite := now(); END IF;
  ELSIF TG_OP = 'UPDATE' AND v_old_kind = 'rejected' AND v_new_kind IS DISTINCT FROM 'rejected' THEN
    -- Saiu de rejeitada → volta para pendente, limpa motivo/data
    NEW.status_aceite := 'pendente';
    NEW.data_aceite := NULL;
    NEW.motivo_rejeicao := NULL;
  ELSIF v_new_kind IN ('open','done','blocked') AND COALESCE(NEW.status_aceite, 'pendente') = 'pendente' THEN
    -- Aceite implícito ao entrar em qualquer coluna não-rejected (exceto se já marcado)
    -- Mantém 'pendente' apenas se for a primeira coluna 'open' (backlog inicial)
    IF TG_OP = 'UPDATE' AND v_old_kind IS DISTINCT FROM v_new_kind THEN
      NEW.status_aceite := 'aceita';
      IF NEW.data_aceite IS NULL THEN NEW.data_aceite := now(); END IF;
    END IF;
  END IF;

  -- Entrou em 'done' → marca data_entrega
  IF v_new_kind = 'done' AND NEW.data_entrega IS NULL THEN
    NEW.data_entrega := now();
  ELSIF TG_OP = 'UPDATE' AND v_old_kind = 'done' AND v_new_kind IS DISTINCT FROM 'done' THEN
    -- Saiu de done → limpa data_entrega
    NEW.data_entrega := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- Log enriquecido com nomes das colunas
CREATE OR REPLACE FUNCTION public.pendency_log_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid := auth.uid();
  v_from_name text;
  v_to_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'created', jsonb_build_object('titulo', NEW.titulo));
    RETURN NEW;
  END IF;
  IF NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    SELECT nome INTO v_from_name FROM public.pendency_columns WHERE id = OLD.column_id;
    SELECT nome INTO v_to_name FROM public.pendency_columns WHERE id = NEW.column_id;
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'moved', jsonb_build_object(
      'from', OLD.column_id, 'to', NEW.column_id,
      'from_name', v_from_name, 'to_name', v_to_name
    ));
  END IF;
  IF NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'assigned', jsonb_build_object('responsavel_id', NEW.responsavel_id));
  END IF;
  IF NEW.status_aceite IS DISTINCT FROM OLD.status_aceite THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, NEW.status_aceite::text, jsonb_build_object('motivo', NEW.motivo_rejeicao));
  END IF;
  IF NEW.data_entrega IS DISTINCT FROM OLD.data_entrega AND NEW.data_entrega IS NOT NULL THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'completed', jsonb_build_object('data_entrega', NEW.data_entrega));
  END IF;
  RETURN NEW;
END;
$function$;