-- Clean orphan rows before adding cascading FKs
DELETE FROM public.event_reminders er
WHERE NOT EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = er.event_id);
DELETE FROM public.event_participants ep
WHERE NOT EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = ep.event_id);
DELETE FROM public.external_event_participants ex
WHERE NOT EXISTS (SELECT 1 FROM public.calendar_events ce WHERE ce.id = ex.event_id);

ALTER TABLE public.event_participants
  DROP CONSTRAINT IF EXISTS event_participants_event_id_fkey,
  ADD CONSTRAINT event_participants_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;

ALTER TABLE public.external_event_participants
  DROP CONSTRAINT IF EXISTS external_event_participants_event_id_fkey,
  ADD CONSTRAINT external_event_participants_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;

ALTER TABLE public.event_reminders
  DROP CONSTRAINT IF EXISTS event_reminders_event_id_fkey,
  ADD CONSTRAINT event_reminders_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Event creators can delete events" ON public.calendar_events;
CREATE POLICY "Event creators can delete events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR current_user_has_capability('calendar.write'));

DROP TRIGGER IF EXISTS trg_notify_event_invitation ON public.event_participants;
DROP TRIGGER IF EXISTS notify_event_invitation_trigger ON public.event_participants;
DROP TRIGGER IF EXISTS notify_event_invitation ON public.event_participants;
DROP TRIGGER IF EXISTS trg_notify_event_update ON public.calendar_events;
DROP TRIGGER IF EXISTS notify_event_update_trigger ON public.calendar_events;
DROP TRIGGER IF EXISTS notify_event_update ON public.calendar_events;
DROP TRIGGER IF EXISTS trg_notify_event_cancellation ON public.calendar_events;
DROP TRIGGER IF EXISTS notify_event_cancellation_trigger ON public.calendar_events;
DROP TRIGGER IF EXISTS notify_event_cancellation ON public.calendar_events;

CREATE OR REPLACE FUNCTION public.cleanup_event_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.notifications
  WHERE reference_id = OLD.id
    AND type IN ('calendar_invite', 'calendar_reminder', 'calendar_update', 'calendar_cancellation');
  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trg_cleanup_event_notifications ON public.calendar_events;
CREATE TRIGGER trg_cleanup_event_notifications
BEFORE DELETE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_event_notifications();