-- Atualizar política de INSERT para incluir administrador
DROP POLICY IF EXISTS "Users can create events" ON calendar_events;

CREATE POLICY "Users can create events" 
ON calendar_events
FOR INSERT
WITH CHECK (
  (created_by = auth.uid()) AND 
  (EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  ))
);

-- Atualizar política de UPDATE para incluir administrador
DROP POLICY IF EXISTS "Simple calendar events update policy" ON calendar_events;

CREATE POLICY "Simple calendar events update policy" 
ON calendar_events
FOR UPDATE
USING (
  (created_by = auth.uid()) OR 
  (get_current_user_role() IN ('coordenador', 'diretor', 'administrador'))
);

-- Atualizar política de SELECT para incluir administrador
DROP POLICY IF EXISTS "Simple calendar events select policy" ON calendar_events;

CREATE POLICY "Simple calendar events select policy" 
ON calendar_events
FOR SELECT
USING (
  (created_by = auth.uid()) OR 
  is_event_participant(id) OR 
  (get_current_user_role() IN ('coordenador', 'diretor', 'administrador'))
);