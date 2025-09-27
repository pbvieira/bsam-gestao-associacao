-- Create external event participants table
CREATE TABLE public.external_event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  status participant_status DEFAULT 'pendente'::participant_status,
  invite_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on external participants
ALTER TABLE public.external_event_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for external participants
CREATE POLICY "Event organizers can manage external participants" 
ON public.external_event_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.calendar_events ce 
    WHERE ce.id = external_event_participants.event_id 
    AND (ce.created_by = auth.uid() OR get_current_user_role() IN ('coordenador', 'diretor'))
  )
);

CREATE POLICY "External participants can view their own data" 
ON public.external_event_participants 
FOR SELECT 
USING (true); -- Allow public read for invite responses

-- Add trigger for updated_at
CREATE TRIGGER update_external_event_participants_updated_at
BEFORE UPDATE ON public.external_event_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to process external participant responses
CREATE OR REPLACE FUNCTION public.update_external_participant_status(
  p_invite_token UUID,
  p_status participant_status
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the participant status
  UPDATE public.external_event_participants 
  SET status = p_status, updated_at = now()
  WHERE invite_token = p_invite_token;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;