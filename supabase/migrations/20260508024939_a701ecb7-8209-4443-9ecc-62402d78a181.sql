
-- 1) Conceder novas capabilities para diretor, coordenador, administrador
INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT r.id, cap.capability, true
FROM public.roles r
CROSS JOIN (VALUES ('calendar.read.all'), ('calendar.manage.all')) AS cap(capability)
WHERE r.key IN ('diretor', 'coordenador', 'administrador')
ON CONFLICT (role_id, capability) DO UPDATE SET allowed = true;

-- 2) Atualizar RLS de calendar_events
DROP POLICY IF EXISTS "Simple calendar events select policy" ON public.calendar_events;
DROP POLICY IF EXISTS "Simple calendar events update policy" ON public.calendar_events;
DROP POLICY IF EXISTS "Event creators can delete events" ON public.calendar_events;

CREATE POLICY "Calendar events select policy"
ON public.calendar_events FOR SELECT
USING (
  created_by = auth.uid()
  OR is_event_participant(id)
  OR current_user_has_capability('calendar.read.all')
  OR current_user_has_capability('calendar.manage.all')
);

CREATE POLICY "Calendar events update policy"
ON public.calendar_events FOR UPDATE
USING (
  created_by = auth.uid()
  OR current_user_has_capability('calendar.manage.all')
);

CREATE POLICY "Calendar events delete policy"
ON public.calendar_events FOR DELETE TO authenticated
USING (
  created_by = auth.uid()
  OR current_user_has_capability('calendar.manage.all')
);

-- 3) Atualizar RLS de event_participants
DROP POLICY IF EXISTS "Event creators can manage participants" ON public.event_participants;
DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;

CREATE POLICY "Manage event participants"
ON public.event_participants FOR ALL
USING (
  EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_participants.event_id AND ce.created_by = auth.uid())
  OR current_user_has_capability('calendar.manage.all')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_participants.event_id AND ce.created_by = auth.uid())
  OR current_user_has_capability('calendar.manage.all')
);

CREATE POLICY "View event participants"
ON public.event_participants FOR SELECT
USING (
  EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_participants.event_id AND ce.created_by = auth.uid())
  OR is_event_participant(event_id)
  OR current_user_has_capability('calendar.read.all')
  OR current_user_has_capability('calendar.manage.all')
);

-- 4) Atualizar RLS de external_event_participants
DROP POLICY IF EXISTS "Event organizers can manage external participants" ON public.external_event_participants;

CREATE POLICY "Manage external participants"
ON public.external_event_participants FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.id = external_event_participants.event_id
      AND (ce.created_by = auth.uid() OR current_user_has_capability('calendar.manage.all'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM calendar_events ce
    WHERE ce.id = external_event_participants.event_id
      AND (ce.created_by = auth.uid() OR current_user_has_capability('calendar.manage.all'))
  )
);
