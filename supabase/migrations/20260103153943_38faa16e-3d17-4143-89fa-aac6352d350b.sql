-- Adicionar campos na tabela work_situations para configuração de tarefas automáticas
ALTER TABLE public.work_situations
ADD COLUMN gerar_tarefa boolean NOT NULL DEFAULT false,
ADD COLUMN texto_tarefa text,
ADD COLUMN setor_tarefa_id uuid REFERENCES public.setores(id) ON DELETE SET NULL,
ADD COLUMN prioridade_tarefa text DEFAULT 'media';

-- Adicionar campos na tabela tasks para rastreamento de origem
ALTER TABLE public.tasks
ADD COLUMN reference_type text,
ADD COLUMN reference_id uuid;

-- Índice para consultas rápidas de verificação de duplicatas
CREATE INDEX idx_tasks_reference ON public.tasks(reference_type, reference_id);

-- Comentários para documentação
COMMENT ON COLUMN public.work_situations.gerar_tarefa IS 'Se true, cria tarefa automaticamente quando aluno é salvo com essa situação';
COMMENT ON COLUMN public.work_situations.texto_tarefa IS 'Texto da tarefa (suporta placeholder {nome_aluno})';
COMMENT ON COLUMN public.work_situations.setor_tarefa_id IS 'Setor que receberá a tarefa';
COMMENT ON COLUMN public.work_situations.prioridade_tarefa IS 'Prioridade da tarefa (baixa, media, alta, urgente)';
COMMENT ON COLUMN public.tasks.reference_type IS 'Tipo de registro que gerou a tarefa automaticamente (ex: student_work_situation)';
COMMENT ON COLUMN public.tasks.reference_id IS 'ID do registro que gerou a tarefa (ex: student_id)';