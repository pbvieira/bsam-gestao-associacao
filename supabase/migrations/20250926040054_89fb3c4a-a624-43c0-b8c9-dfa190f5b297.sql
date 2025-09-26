-- Resolver recursão infinita criando funções SECURITY DEFINER
-- e recriando políticas RLS sem referências circulares

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

-- 3. Criar função para verificar se usuário pode ver evento
CREATE OR REPLACE FUNCTION public.can_view_event(event_uuid uuid, creator_uuid uuid)
RETURNS BOOLEAN AS $$
  SELECT (
    creator_uuid = auth.uid() OR 
    public.is_event_participant(event_uuid) OR
    public.get_current_user_role() IN ('coordenador', 'diretor')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- 4. Recriar políticas para event_participants sem recursão
DROP POLICY IF EXISTS "Event creators can manage participants" ON public.event_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible events" ON public.event_participants;

CREATE POLICY "Event creators and participants can manage participants" 
ON public.event_participants 
FOR ALL 
USING (
  user_id = auth.uid() OR 
  public.get_current_user_role() IN ('coordenador', 'diretor')
);

-- 5. Recriar políticas para calendar_events sem recursão
DROP POLICY IF EXISTS "Users can view events they created or are participants" ON public.calendar_events;

CREATE POLICY "Users can view accessible events" 
ON public.calendar_events 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  public.is_event_participant(id) OR
  public.get_current_user_role() IN ('coordenador', 'diretor')
);

-- 6. Simplificar política de update para calendar_events
DROP POLICY IF EXISTS "Users can update their own events" ON public.calendar_events;

CREATE POLICY "Users can update their own events or admins can update all" 
ON public.calendar_events 
FOR UPDATE 
USING (
  created_by = auth.uid() OR 
  public.get_current_user_role() IN ('coordenador', 'diretor')
);