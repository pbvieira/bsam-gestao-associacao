-- Adicionar foreign key para relacionar realizado_por com profiles
ALTER TABLE public.medical_appointment_log
ADD CONSTRAINT fk_medical_appointment_log_realizado_por
FOREIGN KEY (realizado_por) REFERENCES public.profiles(user_id)
ON DELETE SET NULL;