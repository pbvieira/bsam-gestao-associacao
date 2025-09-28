-- Corrigir políticas RLS para permitir que administradores gerenciem perfis de outros usuários

-- Remover política restritiva de UPDATE
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Criar nova política de UPDATE que permite administradores editarem qualquer perfil
CREATE POLICY "Users can update profiles with admin access" ON public.profiles
FOR UPDATE USING (
  (auth.uid() = user_id) OR 
  is_admin_user(auth.uid())
);

-- Adicionar política de DELETE para administradores (caso necessário no futuro)
CREATE POLICY "Admins can delete profiles" ON public.profiles  
FOR DELETE USING (
  is_admin_user(auth.uid()) AND 
  user_id != auth.uid() -- Impedir auto-exclusão
);