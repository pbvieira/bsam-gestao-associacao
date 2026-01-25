-- Criar índices únicos parciais para CPF e RG
-- Índices parciais permitem múltiplos NULLs e vazios,
-- mas garantem unicidade quando preenchidos

CREATE UNIQUE INDEX IF NOT EXISTS students_cpf_unique 
ON public.students (cpf) 
WHERE cpf IS NOT NULL AND cpf != '';

CREATE UNIQUE INDEX IF NOT EXISTS students_rg_unique 
ON public.students (rg) 
WHERE rg IS NOT NULL AND rg != '';