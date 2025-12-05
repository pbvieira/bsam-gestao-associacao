-- Adicionar campos para controle de "Não sabe" da data de nascimento
ALTER TABLE student_basic_data
ADD COLUMN IF NOT EXISTS data_nascimento_mae_desconhecida BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_nascimento_pai_desconhecida BOOLEAN DEFAULT false;