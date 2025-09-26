-- Adicionar novos tipos de notificação ao enum existente
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'calendar_invite';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'calendar_reminder'; 
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'calendar_update';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'calendar_cancellation';

-- Criar tabela de configurações de notificação
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_1h BOOLEAN NOT NULL DEFAULT true,
  reminder_15min BOOLEAN NOT NULL DEFAULT true,
  reminder_at_time BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de lembretes de eventos
CREATE TABLE IF NOT EXISTS public.event_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- '1h', '15min', 'at_time'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- Policies para notification_settings
CREATE POLICY "Users can manage their own notification settings" 
ON public.notification_settings 
FOR ALL 
USING (user_id = auth.uid());

-- Policies para event_reminders
CREATE POLICY "Users can view their own event reminders" 
ON public.event_reminders 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can manage event reminders" 
ON public.event_reminders 
FOR ALL 
USING (true);

-- Trigger para atualizar updated_at nas novas tabelas
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function para criar notificações de convite
CREATE OR REPLACE FUNCTION public.notify_event_invitation()
RETURNS TRIGGER AS $$
BEGIN
  -- Só notifica se não for o organizador
  IF NEW.user_id != (SELECT created_by FROM calendar_events WHERE id = NEW.event_id) THEN
    INSERT INTO public.notifications (user_id, type, reference_id, title, message)
    VALUES (
      NEW.user_id,
      'calendar_invite',
      NEW.event_id,
      'Convite para evento',
      'Você foi convidado para o evento "' || (SELECT titulo FROM calendar_events WHERE id = NEW.event_id) || '".'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function para criar notificações de atualização de evento
CREATE OR REPLACE FUNCTION public.notify_event_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifica todos os participantes sobre mudanças no evento
  INSERT INTO public.notifications (user_id, type, reference_id, title, message)
  SELECT 
    ep.user_id,
    'calendar_update',
    NEW.id,
    'Evento atualizado',
    'O evento "' || NEW.titulo || '" foi atualizado.'
  FROM event_participants ep
  WHERE ep.event_id = NEW.id 
    AND ep.user_id != NEW.created_by; -- Não notifica o criador
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function para criar notificações de cancelamento de evento
CREATE OR REPLACE FUNCTION public.notify_event_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifica todos os participantes sobre cancelamento
  INSERT INTO public.notifications (user_id, type, reference_id, title, message)
  SELECT 
    ep.user_id,
    'calendar_cancellation',
    OLD.id,
    'Evento cancelado',
    'O evento "' || OLD.titulo || '" foi cancelado.'
  FROM event_participants ep
  WHERE ep.event_id = OLD.id 
    AND ep.user_id != OLD.created_by; -- Não notifica o criador
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function para processar lembretes automáticos
CREATE OR REPLACE FUNCTION public.process_event_reminders()
RETURNS void AS $$
DECLARE
  reminder_record RECORD;
BEGIN
  -- Busca lembretes que precisam ser processados
  FOR reminder_record IN
    SELECT 
      er.id,
      er.event_id,
      er.user_id,
      er.reminder_type,
      ce.titulo
    FROM event_reminders er
    JOIN calendar_events ce ON ce.id = er.event_id
    WHERE er.processed = false 
      AND er.scheduled_for <= now()
      AND ce.data_inicio > now() -- Evento ainda não aconteceu
  LOOP
    -- Cria a notificação de lembrete
    INSERT INTO public.notifications (user_id, type, reference_id, title, message)
    VALUES (
      reminder_record.user_id,
      'calendar_reminder',
      reminder_record.event_id,
      'Lembrete de evento',
      CASE reminder_record.reminder_type
        WHEN '1h' THEN 'O evento "' || reminder_record.titulo || '" começa em 1 hora.'
        WHEN '15min' THEN 'O evento "' || reminder_record.titulo || '" começa em 15 minutos.'
        WHEN 'at_time' THEN 'O evento "' || reminder_record.titulo || '" está começando agora!'
        ELSE 'Lembrete do evento "' || reminder_record.titulo || '".'
      END
    );
    
    -- Marca o lembrete como processado
    UPDATE event_reminders 
    SET processed = true 
    WHERE id = reminder_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function para criar lembretes quando um participante é adicionado
CREATE OR REPLACE FUNCTION public.create_event_reminders()
RETURNS TRIGGER AS $$
DECLARE
  event_start TIMESTAMP WITH TIME ZONE;
  user_settings RECORD;
BEGIN
  -- Busca o horário do evento
  SELECT data_inicio INTO event_start
  FROM calendar_events 
  WHERE id = NEW.event_id;
  
  -- Busca as configurações do usuário (ou usa padrões)
  SELECT 
    COALESCE(ns.reminder_1h, true) as reminder_1h,
    COALESCE(ns.reminder_15min, true) as reminder_15min,
    COALESCE(ns.reminder_at_time, true) as reminder_at_time
  INTO user_settings
  FROM notification_settings ns
  WHERE ns.user_id = NEW.user_id;
  
  -- Se não tem configurações, usa os padrões
  IF NOT FOUND THEN
    user_settings.reminder_1h := true;
    user_settings.reminder_15min := true;
    user_settings.reminder_at_time := true;
  END IF;
  
  -- Cria lembretes baseado nas configurações do usuário
  IF user_settings.reminder_1h AND event_start > now() + interval '1 hour' THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, scheduled_for)
    VALUES (NEW.event_id, NEW.user_id, '1h', event_start - interval '1 hour');
  END IF;
  
  IF user_settings.reminder_15min AND event_start > now() + interval '15 minutes' THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, scheduled_for)
    VALUES (NEW.event_id, NEW.user_id, '15min', event_start - interval '15 minutes');
  END IF;
  
  IF user_settings.reminder_at_time AND event_start > now() THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, scheduled_for)
    VALUES (NEW.event_id, NEW.user_id, 'at_time', event_start);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers para eventos de calendário
CREATE TRIGGER notify_event_invitation_trigger
AFTER INSERT ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_invitation();

CREATE TRIGGER notify_event_update_trigger
AFTER UPDATE ON public.calendar_events
FOR EACH ROW
WHEN (OLD.titulo != NEW.titulo OR OLD.data_inicio != NEW.data_inicio OR OLD.data_fim != NEW.data_fim OR OLD.location != NEW.location)
EXECUTE FUNCTION public.notify_event_update();

CREATE TRIGGER notify_event_cancellation_trigger
AFTER DELETE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.notify_event_cancellation();

CREATE TRIGGER create_event_reminders_trigger
AFTER INSERT ON public.event_participants
FOR EACH ROW
EXECUTE FUNCTION public.create_event_reminders();