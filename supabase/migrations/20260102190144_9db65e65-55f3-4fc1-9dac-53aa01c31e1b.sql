-- Add nao_possui_documentos column to students table
ALTER TABLE public.students 
ADD COLUMN nao_possui_documentos boolean DEFAULT false;

-- Add setor_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_tasks_setor_id ON public.tasks(setor_id);