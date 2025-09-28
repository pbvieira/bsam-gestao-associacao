-- Migração para corrigir permissões e adicionar módulos faltantes

-- 1. Adicionar permissões de dashboard para administradores
INSERT INTO public.permissions (module, action, role, allowed)
VALUES ('dashboard', 'read', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- 2. Adicionar permissões de inventory read para administradores (caso não exista)
INSERT INTO public.permissions (module, action, role, allowed)
VALUES ('inventory', 'read', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- 3. Adicionar módulos faltantes para administradores
-- Calendar
INSERT INTO public.permissions (module, action, role, allowed) VALUES 
('calendar', 'read', 'administrador'::user_role, true),
('calendar', 'create', 'administrador'::user_role, true),
('calendar', 'update', 'administrador'::user_role, true),
('calendar', 'delete', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- Tasks  
INSERT INTO public.permissions (module, action, role, allowed) VALUES 
('tasks', 'read', 'administrador'::user_role, true),
('tasks', 'create', 'administrador'::user_role, true),
('tasks', 'update', 'administrador'::user_role, true),
('tasks', 'delete', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- Suppliers
INSERT INTO public.permissions (module, action, role, allowed) VALUES 
('suppliers', 'read', 'administrador'::user_role, true),
('suppliers', 'create', 'administrador'::user_role, true),
('suppliers', 'update', 'administrador'::user_role, true),
('suppliers', 'delete', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- Purchases
INSERT INTO public.permissions (module, action, role, allowed) VALUES 
('purchases', 'read', 'administrador'::user_role, true),
('purchases', 'create', 'administrador'::user_role, true),
('purchases', 'update', 'administrador'::user_role, true),
('purchases', 'delete', 'administrador'::user_role, true)
ON CONFLICT (module, action, role) DO UPDATE SET allowed = true;

-- 4. Migrar registros antigos com ação 'write' para as ações padrão
-- Primeiro, criar novos registros baseados nos antigos
INSERT INTO public.permissions (module, action, role, allowed)
SELECT module, 'create', role, allowed FROM public.permissions 
WHERE action = 'write' AND NOT EXISTS (
  SELECT 1 FROM public.permissions p2 
  WHERE p2.module = permissions.module 
  AND p2.action = 'create' 
  AND p2.role = permissions.role
);

INSERT INTO public.permissions (module, action, role, allowed)
SELECT module, 'update', role, allowed FROM public.permissions 
WHERE action = 'write' AND NOT EXISTS (
  SELECT 1 FROM public.permissions p2 
  WHERE p2.module = permissions.module 
  AND p2.action = 'update' 
  AND p2.role = permissions.role
);

INSERT INTO public.permissions (module, action, role, allowed)
SELECT module, 'delete', role, allowed FROM public.permissions 
WHERE action = 'write' AND NOT EXISTS (
  SELECT 1 FROM public.permissions p2 
  WHERE p2.module = permissions.module 
  AND p2.action = 'delete' 
  AND p2.role = permissions.role
);

-- 5. Remover registros antigos com ação 'write'
DELETE FROM public.permissions WHERE action = 'write';

-- 6. Atualizar cache de permissões removendo timestamp antigo (se existir algum mecanismo)
-- Isso forçará o reload das permissões na próxima verificação