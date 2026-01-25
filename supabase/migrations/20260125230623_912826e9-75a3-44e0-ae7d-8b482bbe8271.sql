-- First, remove the default value that depends on the sequence
ALTER TABLE public.students ALTER COLUMN codigo_cadastro DROP DEFAULT;

-- Drop the old sequence
DROP SEQUENCE IF EXISTS students_seq;

-- Create new sequence starting from 1
CREATE SEQUENCE students_seq START 1;

-- Set the new default value with yyyy-nnn format (3 digits instead of 4)
ALTER TABLE public.students 
ALTER COLUMN codigo_cadastro SET DEFAULT to_char(now(), 'YYYY') || '-' || lpad(nextval('students_seq')::text, 3, '0');