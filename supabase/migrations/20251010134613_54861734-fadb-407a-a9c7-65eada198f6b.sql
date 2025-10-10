-- Adicionar novos campos à tabela student_basic_data
ALTER TABLE public.student_basic_data
ADD COLUMN estuda boolean DEFAULT false,
ADD COLUMN estado_reside text,
ADD COLUMN cidade_reside text,
ADD COLUMN ha_processos boolean DEFAULT false;

-- Alterar o campo batizado de boolean para text
-- Primeiro, converter os valores existentes
ALTER TABLE public.student_basic_data
ALTER COLUMN batizado TYPE text
USING CASE 
  WHEN batizado = true THEN 'Sim'
  WHEN batizado = false THEN 'Não'
  ELSE 'Não'
END;

-- Definir valor padrão para batizado
ALTER TABLE public.student_basic_data
ALTER COLUMN batizado SET DEFAULT 'Não';