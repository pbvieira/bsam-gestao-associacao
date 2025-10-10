-- Remover policy antiga de event_participants
DROP POLICY IF EXISTS "Simple event participants policy" ON event_participants;

-- Criar policy separada para SELECT - permitir ver todos os participantes de eventos acessíveis
CREATE POLICY "Users can view event participants"
ON event_participants
FOR SELECT
USING (
  -- Pode ver participantes de eventos que ele criou
  EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.id = event_participants.event_id
    AND ce.created_by = auth.uid()
  )
  OR
  -- Pode ver participantes de eventos que ele participa
  EXISTS (
    SELECT 1 FROM event_participants ep
    WHERE ep.event_id = event_participants.event_id
    AND ep.user_id = auth.uid()
  )
  OR
  -- Coordenadores, diretores e administradores podem ver todos
  get_current_user_role() IN ('coordenador', 'diretor', 'administrador')
);

-- Criar policy para INSERT/UPDATE/DELETE - apenas criadores de eventos e administradores
CREATE POLICY "Event creators can manage participants"
ON event_participants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.id = event_participants.event_id
    AND ce.created_by = auth.uid()
  )
  OR
  get_current_user_role() IN ('coordenador', 'diretor', 'administrador')
);