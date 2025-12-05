-- Adicionar campo para controle de "Não sabe" da data de nascimento da esposa
ALTER TABLE student_basic_data
ADD COLUMN IF NOT EXISTS data_nascimento_conjuge_desconhecida BOOLEAN DEFAULT false;