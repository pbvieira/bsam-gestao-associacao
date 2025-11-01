-- Adicionar política para permitir que usuários removam sua própria participação
-- Necessário para que ao recusar um convite, o participante seja removido do evento
CREATE POLICY "Users can delete their own participation"
ON event_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());