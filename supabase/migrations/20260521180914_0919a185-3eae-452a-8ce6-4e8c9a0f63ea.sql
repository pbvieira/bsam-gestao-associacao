ALTER TABLE public.vaccination_queue
  ADD CONSTRAINT vaccination_queue_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE,
  ADD CONSTRAINT vaccination_queue_vaccine_type_id_fkey
    FOREIGN KEY (vaccine_type_id) REFERENCES public.vaccine_types(id) ON DELETE CASCADE;

ALTER TABLE public.vaccination_trips
  ADD CONSTRAINT vaccination_trips_vaccine_type_id_fkey
    FOREIGN KEY (vaccine_type_id) REFERENCES public.vaccine_types(id) ON DELETE RESTRICT,
  ADD CONSTRAINT vaccination_trips_setor_id_fkey
    FOREIGN KEY (setor_id) REFERENCES public.setores(id) ON DELETE SET NULL,
  ADD CONSTRAINT vaccination_trips_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;