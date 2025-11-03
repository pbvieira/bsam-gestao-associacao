-- Enable real-time updates for calendar tables
ALTER TABLE public.calendar_events REPLICA IDENTITY FULL;
ALTER TABLE public.event_participants REPLICA IDENTITY FULL;
ALTER TABLE public.external_event_participants REPLICA IDENTITY FULL;

-- Add calendar tables to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.external_event_participants;