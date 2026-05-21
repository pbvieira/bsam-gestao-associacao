ALTER TABLE public.student_children ADD COLUMN IF NOT EXISTS tem_contato_filhos boolean NOT NULL DEFAULT false;
ALTER TABLE public.student_children_list ADD COLUMN IF NOT EXISTS tipo_filiacao text;