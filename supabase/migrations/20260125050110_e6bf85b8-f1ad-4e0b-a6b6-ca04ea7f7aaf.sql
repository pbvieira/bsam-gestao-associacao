-- Adicionar policy de DELETE para que usuários possam deletar suas próprias notificações
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());