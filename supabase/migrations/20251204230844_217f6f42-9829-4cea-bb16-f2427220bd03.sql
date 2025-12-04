-- Remove estado_reside and cidade_reside columns from student_basic_data
ALTER TABLE public.student_basic_data DROP COLUMN IF EXISTS estado_reside;
ALTER TABLE public.student_basic_data DROP COLUMN IF EXISTS cidade_reside;