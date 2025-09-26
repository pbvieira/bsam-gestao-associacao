-- Criação das tabelas para o sistema de gestão de tarefas e agendamentos

-- Enum para prioridades de tarefas
CREATE TYPE task_priority AS ENUM ('baixa', 'media', 'alta', 'urgente');

-- Enum para status de tarefas
CREATE TYPE task_status AS ENUM ('pendente', 'em_andamento', 'realizada', 'cancelada', 'transferida');

-- Enum para tipos de eventos
CREATE TYPE event_type AS ENUM ('reuniao', 'atendimento', 'evento', 'lembrete');

-- Enum para recorrência de eventos
CREATE TYPE recurrence_type AS ENUM ('none', 'daily', 'weekly', 'monthly');

-- Enum para status de participantes
CREATE TYPE participant_status AS ENUM ('pendente', 'aceito', 'recusado');

-- Enum para tipos de notificações
CREATE TYPE notification_type AS ENUM ('task', 'event', 'reminder', 'mention');

-- Tabela de tarefas
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade task_priority NOT NULL DEFAULT 'media',
  status task_status NOT NULL DEFAULT 'pendente',
  categoria TEXT,
  data_vencimento TIMESTAMP WITH TIME ZONE,
  data_conclusao TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  assigned_to UUID NOT NULL,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  parent_task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON DELETE SET NULL
);

-- Tabela de comentários de tarefas
CREATE TABLE public.task_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE
);

-- Tabela de anexos de tarefas
CREATE TABLE public.task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE
);

-- Tabela de eventos do calendário
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo event_type NOT NULL DEFAULT 'evento',
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  recurrence_type recurrence_type DEFAULT 'none',
  recurrence_end TIMESTAMP WITH TIME ZONE,
  location TEXT,
  created_by UUID NOT NULL,
  task_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL
);

-- Tabela de participantes de eventos
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status participant_status DEFAULT 'pendente',
  is_organizer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  reference_id UUID,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tarefas
CREATE POLICY "Users can view tasks assigned to them or created by them" 
ON public.tasks FOR SELECT 
USING (
  assigned_to = auth.uid() OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

CREATE POLICY "Users can create tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Users can update their own tasks or assigned tasks" 
ON public.tasks FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

CREATE POLICY "Only creators and admins can delete tasks" 
ON public.tasks FOR DELETE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

-- Políticas RLS para comentários de tarefas
CREATE POLICY "Users can view comments on accessible tasks" 
ON public.task_comments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_comments.task_id 
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

CREATE POLICY "Users can create comments on accessible tasks" 
ON public.task_comments FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_comments.task_id 
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
  )
);

-- Políticas RLS para anexos de tarefas
CREATE POLICY "Users can view attachments on accessible tasks" 
ON public.task_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_attachments.task_id 
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

CREATE POLICY "Users can upload attachments to accessible tasks" 
ON public.task_attachments FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_attachments.task_id 
    AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
  )
);

-- Políticas RLS para eventos do calendário
CREATE POLICY "Users can view events they created or are participants" 
ON public.calendar_events FOR SELECT 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.event_participants ep 
    WHERE ep.event_id = calendar_events.id 
    AND ep.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

CREATE POLICY "Users can create events" 
ON public.calendar_events FOR INSERT 
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Users can update their own events" 
ON public.calendar_events FOR UPDATE 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

-- Políticas RLS para participantes de eventos
CREATE POLICY "Users can view participants of accessible events" 
ON public.event_participants FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.calendar_events ce 
    WHERE ce.id = event_participants.event_id 
    AND ce.created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

CREATE POLICY "Event creators can manage participants" 
ON public.event_participants FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events ce 
    WHERE ce.id = event_participants.event_id 
    AND ce.created_by = auth.uid()
  ) OR
  user_id = auth.uid()
);

-- Políticas RLS para notificações
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications for users" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = auth.uid());

-- Triggers para atualizar updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_prioridade ON public.tasks(prioridade);
CREATE INDEX idx_tasks_data_vencimento ON public.tasks(data_vencimento);

CREATE INDEX idx_calendar_events_created_by ON public.calendar_events(created_by);
CREATE INDEX idx_calendar_events_data_inicio ON public.calendar_events(data_inicio);
CREATE INDEX idx_calendar_events_data_fim ON public.calendar_events(data_fim);

CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Função para criar notificação automática quando tarefa é atribuída
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Só notifica se for uma nova atribuição ou mudança de responsável
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to != NEW.assigned_to) THEN
    -- Não notifica se o usuário está atribuindo para si mesmo
    IF NEW.created_by != NEW.assigned_to THEN
      INSERT INTO public.notifications (user_id, type, reference_id, title, message)
      VALUES (
        NEW.assigned_to,
        'task',
        NEW.id,
        'Nova tarefa atribuída',
        'A tarefa "' || NEW.titulo || '" foi atribuída para você.'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;