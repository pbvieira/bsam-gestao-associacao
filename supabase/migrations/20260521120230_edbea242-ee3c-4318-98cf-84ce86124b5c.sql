
-- 1. event_reminders: remove permissive ALL policy
DROP POLICY IF EXISTS "System can manage event reminders" ON public.event_reminders;

-- 2. external_event_participants: replace public SELECT with organizer-scoped one
DROP POLICY IF EXISTS "External participants can view their own data" ON public.external_event_participants;

CREATE POLICY "Organizers view external participants"
ON public.external_event_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events ce
    WHERE ce.id = external_event_participants.event_id
      AND (ce.created_by = auth.uid() OR current_user_has_capability('calendar.manage.all'))
  )
);

-- 3. Restrict lookup tables to authenticated users
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'areas','setores','disease_types','disability_types','work_situations',
    'filiation_status','annotation_categories','inventory_categories',
    'medication_usage_types','vaccine_types','income_types','benefit_types',
    'cash_book_entry_categories','cash_book_exit_categories'
  ])
  LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND cmd='SELECT'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY "Authenticated users can view active %1$s" ON public.%1$I FOR SELECT TO authenticated USING (ativo = true)',
      t
    );
  END LOOP;
END $$;

-- 4. Set fixed search_path on functions missing it
ALTER FUNCTION public.module_to_capability(text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
