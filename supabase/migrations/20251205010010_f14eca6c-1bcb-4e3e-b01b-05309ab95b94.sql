-- Remove duplicatas mantendo apenas o registro mais recente de cada student_id
DELETE FROM student_basic_data a
USING student_basic_data b
WHERE a.student_id = b.student_id
  AND a.created_at < b.created_at;

-- Adiciona constraint UNIQUE para prevenir futuras duplicatas
ALTER TABLE student_basic_data 
ADD CONSTRAINT student_basic_data_student_id_unique UNIQUE (student_id);