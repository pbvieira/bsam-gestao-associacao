-- Limpar políticas existentes e recriar sem recursão

-- 1. Criar função para obter role do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 2. Criar função para verificar se usuário é participante de evento
CREATE OR REPLACE FUNCTION public.is_event_participant(event_uuid uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_participants 
    WHERE event_id = event_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 3. Remover todas as políticas problemáticas do event_participants
DROP POLICY IF EXISTS "Event creators can manage participants" ON public.event_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible events" ON public.event_participants;
DROP POLICY IF EXISTS "Event creators and participants can manage participants" ON public.event_participants;

-- 4. Criar política simples para event_participants
CREATE POLICY "Simple event participants policy" 
ON public.event_participants 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  public.get_current_user_role() IN ('coordenador', 'diretor')
);

-- 5. Remover políticas problemáticas do calendar_events
DROP POLICY IF EXISTS "Users can view events they created or are participants" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can view accessible events" ON public.calendar_events;

-- 6. Criar política simples para calendar_events SELECT
CREATE POLICY "Simple calendar events select policy" 
ON public.calendar_events 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  public.is_event_participant(id) OR
  public.get_current_user_role() IN ('coordenador', 'diretor')
);

-- 7. Remover e recriar política de UPDATE para calendar_events
DROP POLICY IF EXISTS "Users can update their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own events or admins can update all" ON public.calendar_events;

CREATE POLICY "Simple calendar events update policy" 
ON public.calendar_events 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  public.get_current_user_role() IN ('coordenador', 'diretor')
);