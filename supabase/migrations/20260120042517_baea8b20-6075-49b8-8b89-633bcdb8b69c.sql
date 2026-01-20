-- Tabela de log de administração de medicamentos
CREATE TABLE public.medication_administration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculos
  medication_id UUID NOT NULL REFERENCES public.student_medications(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.medication_schedules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Data agendada (a data em que deveria ser administrado)
  data_agendada DATE NOT NULL,
  horario_agendado TIME WITHOUT TIME ZONE NOT NULL,
  
  -- Registro da administração
  administrado BOOLEAN NOT NULL DEFAULT false,
  data_administracao TIMESTAMP WITH TIME ZONE,
  administrado_por UUID,
  
  -- Observações
  observacoes TEXT,
  nao_administrado_motivo TEXT,
  
  -- Auditoria
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Índices para performance
CREATE INDEX idx_med_admin_log_data ON public.medication_administration_log(data_agendada);
CREATE INDEX idx_med_admin_log_student ON public.medication_administration_log(student_id);
CREATE INDEX idx_med_admin_log_schedule ON public.medication_administration_log(schedule_id);
CREATE INDEX idx_med_admin_log_medication ON public.medication_administration_log(medication_id);

-- Constraint para evitar duplicatas (um log por schedule/data/horário)
CREATE UNIQUE INDEX idx_med_admin_unique 
  ON public.medication_administration_log(schedule_id, data_agendada, horario_agendado);

-- Habilitar RLS
ALTER TABLE public.medication_administration_log ENABLE ROW LEVEL SECURITY;

-- Política para gerenciar logs (coordenador, diretor, auxiliar, administrador)
CREATE POLICY "Authorized users can manage medication logs"
  ON public.medication_administration_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
      AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
    )
  );

-- Política para visualizar logs (todos autenticados podem ver)
CREATE POLICY "Authenticated users can view medication logs"
  ON public.medication_administration_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_medication_administration_log_updated_at
  BEFORE UPDATE ON public.medication_administration_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();