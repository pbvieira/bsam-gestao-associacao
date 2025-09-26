-- Add missing permissions for suppliers and purchases modules
-- Insert permissions for suppliers module
INSERT INTO public.permissions (role, module, action, allowed) VALUES
  ('diretor', 'suppliers', 'read', true),
  ('diretor', 'suppliers', 'write', true),
  ('diretor', 'suppliers', 'delete', true),
  ('coordenador', 'suppliers', 'read', true),
  ('coordenador', 'suppliers', 'write', true),
  ('auxiliar', 'suppliers', 'read', true);

-- Insert permissions for purchases module  
INSERT INTO public.permissions (role, module, action, allowed) VALUES
  ('diretor', 'purchases', 'read', true),
  ('diretor', 'purchases', 'write', true),
  ('diretor', 'purchases', 'delete', true),
  ('coordenador', 'purchases', 'read', true),
  ('coordenador', 'purchases', 'write', true),
  ('auxiliar', 'purchases', 'read', true),
  ('auxiliar', 'purchases', 'write', true);