
-- =========================================================
-- FASE 1: Estrutura paralela (não-destrutiva)
-- =========================================================

-- 1) Tabela de papéis dinâmicos
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 2) Tabela de capabilities por papel
CREATE TABLE IF NOT EXISTS public.role_capabilities (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  capability text NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, capability)
);

CREATE TRIGGER trg_role_capabilities_updated_at
BEFORE UPDATE ON public.role_capabilities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.role_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view role capabilities"
  ON public.role_capabilities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role capabilities"
  ON public.role_capabilities FOR ALL
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_role_capabilities_capability
  ON public.role_capabilities(capability) WHERE allowed = true;

-- 3) Seed dos 5 papéis de sistema
INSERT INTO public.roles (key, label, description, is_system, ordem) VALUES
  ('administrador', 'Administrador', 'Administrador do sistema com acesso total', true, 1),
  ('diretor',       'Diretor',       'Diretor com acesso amplo de gestão',        true, 2),
  ('coordenador',   'Coordenador',   'Coordenador com acesso operacional amplo',  true, 3),
  ('auxiliar',      'Auxiliar',      'Auxiliar com acesso operacional básico',    true, 4),
  ('aluno',         'Aluno',         'Aluno com acesso aos próprios dados',       true, 5)
ON CONFLICT (key) DO NOTHING;

-- 4) Seed do mapeamento papel ↔ capabilities
WITH r AS (SELECT key, id FROM public.roles)
INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT r.id, c.capability, true
FROM r
JOIN (
  VALUES
    -- administrador (acesso total)
    ('administrador','system.admin'),
    ('administrador','users.manage'),
    ('administrador','roles.manage'),
    ('administrador','aux_tables.manage'),
    ('administrador','documents.templates.manage'),
    ('administrador','reports.read'),
    ('administrador','students.read'),('administrador','students.write'),('administrador','students.delete'),
    ('administrador','students.health.read'),('administrador','students.health.write'),
    ('administrador','students.financial.read'),('administrador','students.financial.write'),
    ('administrador','tasks.read'),('administrador','tasks.write'),('administrador','tasks.delete'),
    ('administrador','calendar.read'),('administrador','calendar.write'),
    ('administrador','inventory.read'),('administrador','inventory.write'),('administrador','inventory.manage'),
    ('administrador','purchases.read'),('administrador','purchases.write'),('administrador','purchases.approve'),
    ('administrador','suppliers.read'),('administrador','suppliers.manage'),
    ('administrador','medications.administer'),
    -- diretor
    ('diretor','users.manage'),('diretor','roles.manage'),
    ('diretor','aux_tables.manage'),('diretor','documents.templates.manage'),('diretor','reports.read'),
    ('diretor','students.read'),('diretor','students.write'),('diretor','students.delete'),
    ('diretor','students.health.read'),('diretor','students.health.write'),
    ('diretor','students.financial.read'),('diretor','students.financial.write'),
    ('diretor','tasks.read'),('diretor','tasks.write'),('diretor','tasks.delete'),
    ('diretor','calendar.read'),('diretor','calendar.write'),
    ('diretor','inventory.read'),('diretor','inventory.write'),('diretor','inventory.manage'),
    ('diretor','purchases.read'),('diretor','purchases.write'),('diretor','purchases.approve'),
    ('diretor','suppliers.read'),('diretor','suppliers.manage'),
    ('diretor','medications.administer'),
    -- coordenador
    ('coordenador','users.manage'),
    ('coordenador','aux_tables.manage'),('coordenador','documents.templates.manage'),('coordenador','reports.read'),
    ('coordenador','students.read'),('coordenador','students.write'),
    ('coordenador','students.health.read'),('coordenador','students.health.write'),
    ('coordenador','students.financial.read'),('coordenador','students.financial.write'),
    ('coordenador','tasks.read'),('coordenador','tasks.write'),('coordenador','tasks.delete'),
    ('coordenador','calendar.read'),('coordenador','calendar.write'),
    ('coordenador','inventory.read'),('coordenador','inventory.write'),('coordenador','inventory.manage'),
    ('coordenador','purchases.read'),('coordenador','purchases.write'),('coordenador','purchases.approve'),
    ('coordenador','suppliers.read'),('coordenador','suppliers.manage'),
    ('coordenador','medications.administer'),
    -- auxiliar
    ('auxiliar','students.read'),('auxiliar','students.write'),
    ('auxiliar','students.health.read'),('auxiliar','students.health.write'),
    ('auxiliar','students.financial.read'),('auxiliar','students.financial.write'),
    ('auxiliar','tasks.read'),('auxiliar','tasks.write'),
    ('auxiliar','calendar.read'),('auxiliar','calendar.write'),
    ('auxiliar','inventory.read'),('auxiliar','inventory.write'),
    ('auxiliar','purchases.read'),('auxiliar','purchases.write'),
    ('auxiliar','suppliers.read'),
    ('auxiliar','medications.administer'),
    -- aluno (apenas leitura básica)
    ('aluno','calendar.read'),('aluno','tasks.read')
) AS c(role_key, capability) ON c.role_key = r.key
ON CONFLICT (role_id, capability) DO NOTHING;

-- 5) Coluna role_id em profiles + backfill
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles(id);

UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE r.key = p.role::text
  AND p.role_id IS DISTINCT FROM r.id;

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles(role_id);

-- 6) Funções de verificação de capability
CREATE OR REPLACE FUNCTION public.has_capability(_user_id uuid, _cap text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.role_capabilities rc ON rc.role_id = p.role_id
    WHERE p.user_id = _user_id
      AND p.active = true
      AND rc.capability = _cap
      AND rc.allowed = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_capability(_cap text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_capability(auth.uid(), _cap);
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_any(_caps text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.role_capabilities rc ON rc.role_id = p.role_id
    WHERE p.user_id = auth.uid()
      AND p.active = true
      AND rc.allowed = true
      AND rc.capability = ANY(_caps)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_system_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_capability(_user_id, 'system.admin');
$$;

CREATE OR REPLACE FUNCTION public.count_active_system_admins()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT p.user_id)::int
  FROM public.profiles p
  JOIN public.role_capabilities rc ON rc.role_id = p.role_id
  WHERE p.active = true
    AND rc.capability = 'system.admin'
    AND rc.allowed = true;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role_key()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.key
  FROM public.profiles p
  JOIN public.roles r ON r.id = p.role_id
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;
