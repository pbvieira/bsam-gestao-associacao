-- Fase 1: Criar sistema dinâmico de gestão de permissões por role

-- 1. Criar tabela para armazenar permissões dinâmicas
CREATE TABLE public.role_module_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role user_role NOT NULL,
  module text NOT NULL,
  allowed boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, module)
);

-- 2. Popular tabela com dados atuais do MODULE_ACCESS
INSERT INTO public.role_module_access (role, module, allowed) VALUES
-- diretor - todos os módulos
('diretor', 'dashboard', true),
('diretor', 'users', true),
('diretor', 'students', true),
('diretor', 'tasks', true),
('diretor', 'calendar', true),
('diretor', 'inventory', true),
('diretor', 'suppliers', true),
('diretor', 'purchases', true),
('diretor', 'reports', true),

-- coordenador - todos os módulos
('coordenador', 'dashboard', true),
('coordenador', 'users', true),
('coordenador', 'students', true),
('coordenador', 'tasks', true),
('coordenador', 'calendar', true),
('coordenador', 'inventory', true),
('coordenador', 'suppliers', true),
('coordenador', 'purchases', true),
('coordenador', 'reports', true),

-- auxiliar - módulos limitados
('auxiliar', 'dashboard', true),
('auxiliar', 'students', true),
('auxiliar', 'tasks', true),
('auxiliar', 'calendar', true),
('auxiliar', 'inventory', true),
('auxiliar', 'users', false),
('auxiliar', 'suppliers', false),
('auxiliar', 'purchases', false),
('auxiliar', 'reports', false),

-- aluno - módulos básicos
('aluno', 'dashboard', true),
('aluno', 'tasks', true),
('aluno', 'calendar', true),
('aluno', 'users', false),
('aluno', 'students', false),
('aluno', 'inventory', false),
('aluno', 'suppliers', false),
('aluno', 'purchases', false),
('aluno', 'reports', false),

-- administrador - todos os módulos
('administrador', 'dashboard', true),
('administrador', 'users', true),
('administrador', 'students', true),
('administrador', 'tasks', true),
('administrador', 'calendar', true),
('administrador', 'inventory', true),
('administrador', 'suppliers', true),
('administrador', 'purchases', true),
('administrador', 'reports', true);

-- 3. Habilitar RLS na tabela
ALTER TABLE public.role_module_access ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS - apenas diretores e administradores podem gerenciar
CREATE POLICY "Diretores e administradores podem gerenciar permissões" 
ON public.role_module_access 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('diretor', 'administrador')
  )
);

-- 5. Política para visualização - todos usuários autenticados podem ver suas próprias permissões
CREATE POLICY "Usuários podem ver permissões de seu role" 
ON public.role_module_access 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = role_module_access.role
  )
);

-- 6. Criar trigger para atualizar updated_at
CREATE TRIGGER update_role_module_access_updated_at
BEFORE UPDATE ON public.role_module_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();