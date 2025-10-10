-- Criar função SECURITY DEFINER para verificar participação em eventos
CREATE OR REPLACE FUNCTION public.is_event_participant(event_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_participants 
    WHERE event_id = event_uuid AND user_id = auth.uid()
  );
$$;

-- Remover policies problemáticas de event_participants
DROP POLICY IF EXISTS "Users can view event participants" ON event_participants;
DROP POLICY IF EXISTS "Event creators can manage participants" ON event_participants;

-- Recriar policy de SELECT usando a função segura
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
  -- Pode ver participantes de eventos que ele participa (usando função segura)
  public.is_event_participant(event_participants.event_id)
  OR
  -- Coordenadores, diretores e administradores podem ver todos
  get_current_user_role() IN ('coordenador', 'diretor', 'administrador')
);

-- Recriar policy de gerenciamento (INSERT/UPDATE/DELETE)
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

-- Atualizar policy de calendar_events para usar a função segura
DROP POLICY IF EXISTS "Simple calendar events select policy" ON calendar_events;

CREATE POLICY "Simple calendar events select policy"
ON calendar_events
FOR SELECT
USING (
  created_by = auth.uid() 
  OR 
  public.is_event_participant(id)
  OR 
  get_current_user_role() IN ('coordenador', 'diretor', 'administrador')
);