-- Atualizar o papel do usuário pbvieira.santos@gmail.com de "aluno" para "administrador"
-- para dar acesso completo ao sistema

UPDATE public.profiles 
SET role = 'administrador', updated_at = now()
WHERE user_id = '6fb60839-416f-43fa-b491-c2e79445d07a';