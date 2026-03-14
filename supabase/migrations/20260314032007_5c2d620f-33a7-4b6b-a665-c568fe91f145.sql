-- Drop and recreate foreign keys with ON DELETE CASCADE for all tables referencing students

ALTER TABLE public.student_basic_data DROP CONSTRAINT student_basic_data_student_id_fkey;
ALTER TABLE public.student_basic_data ADD CONSTRAINT student_basic_data_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_annotations DROP CONSTRAINT student_annotations_student_id_fkey;
ALTER TABLE public.student_annotations ADD CONSTRAINT student_annotations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_cash_book DROP CONSTRAINT student_cash_book_student_id_fkey;
ALTER TABLE public.student_cash_book ADD CONSTRAINT student_cash_book_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_children DROP CONSTRAINT student_children_student_id_fkey;
ALTER TABLE public.student_children ADD CONSTRAINT student_children_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_disabilities DROP CONSTRAINT student_disabilities_student_id_fkey;
ALTER TABLE public.student_disabilities ADD CONSTRAINT student_disabilities_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_diseases DROP CONSTRAINT student_diseases_student_id_fkey;
ALTER TABLE public.student_diseases ADD CONSTRAINT student_diseases_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_documents DROP CONSTRAINT student_documents_student_id_fkey;
ALTER TABLE public.student_documents ADD CONSTRAINT student_documents_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_emergency_contacts DROP CONSTRAINT student_emergency_contacts_student_id_fkey;
ALTER TABLE public.student_emergency_contacts ADD CONSTRAINT student_emergency_contacts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_health_data DROP CONSTRAINT student_health_data_student_id_fkey;
ALTER TABLE public.student_health_data ADD CONSTRAINT student_health_data_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_benefits_list DROP CONSTRAINT student_benefits_list_student_id_fkey;
ALTER TABLE public.student_benefits_list ADD CONSTRAINT student_benefits_list_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.medication_administration_log DROP CONSTRAINT medication_administration_log_student_id_fkey;
ALTER TABLE public.medication_administration_log ADD CONSTRAINT medication_administration_log_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_stays_student_id_fkey') THEN
    ALTER TABLE public.student_stays DROP CONSTRAINT student_stays_student_id_fkey;
    ALTER TABLE public.student_stays ADD CONSTRAINT student_stays_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_work_situation_student_id_fkey') THEN
    ALTER TABLE public.student_work_situation DROP CONSTRAINT student_work_situation_student_id_fkey;
    ALTER TABLE public.student_work_situation ADD CONSTRAINT student_work_situation_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_income_list_student_id_fkey') THEN
    ALTER TABLE public.student_income_list DROP CONSTRAINT student_income_list_student_id_fkey;
    ALTER TABLE public.student_income_list ADD CONSTRAINT student_income_list_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_medications_student_id_fkey') THEN
    ALTER TABLE public.student_medications DROP CONSTRAINT student_medications_student_id_fkey;
    ALTER TABLE public.student_medications ADD CONSTRAINT student_medications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_medical_records_student_id_fkey') THEN
    ALTER TABLE public.student_medical_records DROP CONSTRAINT student_medical_records_student_id_fkey;
    ALTER TABLE public.student_medical_records ADD CONSTRAINT student_medical_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_hospitalizations_student_id_fkey') THEN
    ALTER TABLE public.student_hospitalizations DROP CONSTRAINT student_hospitalizations_student_id_fkey;
    ALTER TABLE public.student_hospitalizations ADD CONSTRAINT student_hospitalizations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_vaccines_student_id_fkey') THEN
    ALTER TABLE public.student_vaccines DROP CONSTRAINT student_vaccines_student_id_fkey;
    ALTER TABLE public.student_vaccines ADD CONSTRAINT student_vaccines_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;