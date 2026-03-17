ALTER TABLE public.student_medical_records
  ADD COLUMN consideracoes text,
  ADD COLUMN houve_encaminhamento boolean NOT NULL DEFAULT false,
  ADD COLUMN encaminhamento text;