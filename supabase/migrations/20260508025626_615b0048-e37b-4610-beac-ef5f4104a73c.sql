DO $$
DECLARE
  v_event_id uuid := gen_random_uuid();
  v_user_id uuid := '65b796cd-a96d-493a-855c-3d403b0cc753';
  v_other_user uuid := '7e93094c-43de-42a7-a690-e7d8aa32e864';
  v_count int;
BEGIN
  -- 1) Criar evento
  INSERT INTO calendar_events (id, titulo, data_inicio, data_fim, tipo, created_by)
  VALUES (v_event_id, '__TEST_CASCADE__', now() + interval '2 hours', now() + interval '3 hours', 'evento', v_user_id);

  -- 2) Participante interno (trigger criará reminders automaticamente + notificação de convite)
  INSERT INTO event_participants (event_id, user_id, status)
  VALUES (v_event_id, v_other_user, 'pendente');

  -- 3) Participante externo
  INSERT INTO external_event_participants (event_id, name, email)
  VALUES (v_event_id, 'Teste Externo', 'teste@example.com');

  -- 4) Notificações manuais cobrindo todos os tipos relevantes
  INSERT INTO notifications (user_id, type, reference_id, title, message) VALUES
    (v_other_user, 'calendar_invite',       v_event_id, 'invite',  'msg'),
    (v_other_user, 'calendar_reminder',     v_event_id, 'rem',     'msg'),
    (v_other_user, 'calendar_update',       v_event_id, 'upd',     'msg'),
    (v_other_user, 'calendar_cancellation', v_event_id, 'cancel',  'msg');

  -- Sanity check antes de deletar
  SELECT count(*) INTO v_count FROM event_participants WHERE event_id = v_event_id;
  IF v_count = 0 THEN RAISE EXCEPTION 'setup falhou: participante interno nao inserido'; END IF;

  SELECT count(*) INTO v_count FROM event_reminders WHERE event_id = v_event_id;
  IF v_count = 0 THEN RAISE EXCEPTION 'setup falhou: lembretes nao criados pelo trigger'; END IF;

  SELECT count(*) INTO v_count FROM external_event_participants WHERE event_id = v_event_id;
  IF v_count = 0 THEN RAISE EXCEPTION 'setup falhou: participante externo nao inserido'; END IF;

  SELECT count(*) INTO v_count FROM notifications WHERE reference_id = v_event_id;
  IF v_count < 4 THEN RAISE EXCEPTION 'setup falhou: notificacoes nao inseridas (got %)', v_count; END IF;

  RAISE NOTICE '[TEST] Setup OK. Excluindo evento %', v_event_id;

  -- 5) Excluir o evento (deve disparar cleanup_event_notifications + cascades)
  DELETE FROM calendar_events WHERE id = v_event_id;

  -- 6) Validar limpeza
  SELECT count(*) INTO v_count FROM event_participants WHERE event_id = v_event_id;
  IF v_count <> 0 THEN RAISE EXCEPTION 'FALHA: % participantes internos remanescentes', v_count; END IF;

  SELECT count(*) INTO v_count FROM event_reminders WHERE event_id = v_event_id;
  IF v_count <> 0 THEN RAISE EXCEPTION 'FALHA: % lembretes remanescentes', v_count; END IF;

  SELECT count(*) INTO v_count FROM external_event_participants WHERE event_id = v_event_id;
  IF v_count <> 0 THEN RAISE EXCEPTION 'FALHA: % participantes externos remanescentes', v_count; END IF;

  SELECT count(*) INTO v_count FROM notifications
    WHERE reference_id = v_event_id
      AND type IN ('calendar_invite','calendar_reminder','calendar_update','calendar_cancellation');
  IF v_count <> 0 THEN RAISE EXCEPTION 'FALHA: % notificacoes orfas remanescentes', v_count; END IF;

  RAISE NOTICE '[TEST] OK: cascades e cleanup_event_notifications funcionando corretamente';
END $$;