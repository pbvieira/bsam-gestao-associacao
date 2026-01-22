-- Tabela para controle de realização de atendimentos
CREATE TABLE public.medical_appointment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id uuid NOT NULL REFERENCES public.student_medical_records(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('atendimento', 'retorno')),
  data_agendada date NOT NULL,
  realizado boolean DEFAULT false,
  data_realizacao timestamptz,
  realizado_por uuid,
  nao_realizado_motivo text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_medical_appointment_log_date ON public.medical_appointment_log(data_agendada);
CREATE INDEX idx_medical_appointment_log_record ON public.medical_appointment_log(medical_record_id);
CREATE INDEX idx_medical_appointment_log_tipo ON public.medical_appointment_log(tipo);

-- Enable RLS
ALTER TABLE public.medical_appointment_log ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários autorizados podem visualizar logs
CREATE POLICY "Authenticated users can view appointment logs"
  ON public.medical_appointment_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
  ));

-- Policy: Usuários autorizados podem gerenciar logs
CREATE POLICY "Authorized users can manage appointment logs"
  ON public.medical_appointment_log
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('coordenador', 'diretor', 'auxiliar', 'administrador')
  ));

-- Trigger para updated_at
CREATE TRIGGER update_medical_appointment_log_updated_at
  BEFORE UPDATE ON public.medical_appointment_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();