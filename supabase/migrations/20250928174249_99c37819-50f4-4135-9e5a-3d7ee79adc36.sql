-- Correção de permissões para resolver problema de acesso do usuário aluno

-- 1. Adicionar permissão reports/read para role aluno (estava faltando)
INSERT INTO public.permissions (module, action, role, allowed)
VALUES ('reports', 'read', 'aluno'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- 2. Verificar e corrigir todas as permissões básicas para aluno
INSERT INTO public.permissions (module, action, role, allowed) VALUES 
('dashboard', 'read', 'aluno'::user_role, true),
('profile', 'read', 'aluno'::user_role, true),
('profile', 'update', 'aluno'::user_role, true),
('tasks', 'read', 'aluno'::user_role, true),
('calendar', 'read', 'aluno'::user_role, true),
('users', 'read', 'aluno'::user_role, true),
('reports', 'read', 'aluno'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- 3. Garantir que administradores tenham todas as permissões
INSERT INTO public.permissions (module, action, role, allowed) VALUES 
('dashboard', 'read', 'administrador'::user_role, true),
('profile', 'read', 'administrador'::user_role, true),
('profile', 'update', 'administrador'::user_role, true),
('users', 'read', 'administrador'::user_role, true),
('users', 'create', 'administrador'::user_role, true),
('users', 'update', 'administrador'::user_role, true),
('users', 'delete', 'administrador'::user_role, true),
('students', 'read', 'administrador'::user_role, true),
('students', 'create', 'administrador'::user_role, true),
('students', 'update', 'administrador'::user_role, true),
('students', 'delete', 'administrador'::user_role, true),
('inventory', 'read', 'administrador'::user_role, true),
('inventory', 'create', 'administrador'::user_role, true),
('inventory', 'update', 'administrador'::user_role, true),
('inventory', 'delete', 'administrador'::user_role, true),
('suppliers', 'read', 'administrador'::user_role, true),
('suppliers', 'create', 'administrador'::user_role, true),
('suppliers', 'update', 'administrador'::user_role, true),
('suppliers', 'delete', 'administrador'::user_role, true),
('purchases', 'read', 'administrador'::user_role, true),
('purchases', 'create', 'administrador'::user_role, true),
('purchases', 'update', 'administrador'::user_role, true),
('purchases', 'delete', 'administrador'::user_role, true),
('tasks', 'read', 'administrador'::user_role, true),
('tasks', 'create', 'administrador'::user_role, true),
('tasks', 'update', 'administrador'::user_role, true),
('tasks', 'delete', 'administrador'::user_role, true),
('calendar', 'read', 'administrador'::user_role, true),
('calendar', 'create', 'administrador'::user_role, true),
('calendar', 'update', 'administrador'::user_role, true),
('calendar', 'delete', 'administrador'::user_role, true),
('reports', 'read', 'administrador'::user_role, true),
('reports', 'export', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;