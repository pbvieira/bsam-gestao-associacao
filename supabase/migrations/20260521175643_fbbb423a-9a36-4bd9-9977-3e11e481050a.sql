
-- Vaccination queue: students awaiting vaccination
CREATE TABLE public.vaccination_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaccine_type_id uuid NOT NULL,
  data_prevista date,
  data_realizada date,
  setor_id uuid,
  responsavel_id uuid,
  task_id uuid,
  status text NOT NULL DEFAULT 'agendada',
  observacoes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.vaccination_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  vaccine_type_id uuid NOT NULL,
  trip_id uuid REFERENCES public.vaccination_trips(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente',
  added_by uuid NOT NULL,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX vaccination_queue_unique_pending
  ON public.vaccination_queue (student_id, vaccine_type_id)
  WHERE status <> 'cancelada';

CREATE INDEX vaccination_queue_trip_idx ON public.vaccination_queue(trip_id);
CREATE INDEX vaccination_trips_status_idx ON public.vaccination_trips(status);

ALTER TABLE public.vaccination_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccination_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read vaccination queue"
  ON public.vaccination_queue FOR SELECT
  USING (current_user_has_capability('students.health.read'));

CREATE POLICY "Manage vaccination queue"
  ON public.vaccination_queue FOR ALL
  USING (current_user_has_capability('students.health.write'))
  WITH CHECK (current_user_has_capability('students.health.write'));

CREATE POLICY "Read vaccination trips"
  ON public.vaccination_trips FOR SELECT
  USING (current_user_has_capability('students.health.read'));

CREATE POLICY "Manage vaccination trips"
  ON public.vaccination_trips FOR ALL
  USING (current_user_has_capability('students.health.write'))
  WITH CHECK (current_user_has_capability('students.health.write'));

CREATE TRIGGER update_vaccination_queue_updated_at
  BEFORE UPDATE ON public.vaccination_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vaccination_trips_updated_at
  BEFORE UPDATE ON public.vaccination_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
