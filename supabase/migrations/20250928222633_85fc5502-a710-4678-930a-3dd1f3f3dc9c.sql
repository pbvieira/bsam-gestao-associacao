-- Inserir o novo módulo "annotation_categories" na tabela role_module_access
-- Conceder permissão para coordenadores, diretores e administradores

INSERT INTO public.role_module_access (role, module, allowed) VALUES
('coordenador', 'annotation_categories', true),
('diretor', 'annotation_categories', true),
('administrador', 'annotation_categories', true);

-- Para auxiliares e alunos, não inserimos nada (padrão é false/não permitido)