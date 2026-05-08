-- Audit log table
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL CHECK (entity IN ('role', 'role_capability')),
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'granted', 'revoked')),
  role_id uuid,
  role_label text,
  role_key text,
  capability text,
  before_data jsonb,
  after_data jsonb,
  actor_id uuid,
  actor_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_audit_log_role_id ON public.role_audit_log(role_id);
CREATE INDEX IF NOT EXISTS idx_role_audit_log_created_at ON public.role_audit_log(created_at DESC);

ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Roles managers can view audit log" ON public.role_audit_log;
CREATE POLICY "Roles managers can view audit log"
  ON public.role_audit_log FOR SELECT
  TO authenticated
  USING (current_user_has_capability('roles.manage'));

-- No direct INSERT/UPDATE/DELETE policies: triggers run as SECURITY DEFINER and bypass RLS.

-- Helper: actor name
CREATE OR REPLACE FUNCTION public.audit_current_actor_name()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT full_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Trigger fn for roles
CREATE OR REPLACE FUNCTION public.audit_roles_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text := public.audit_current_actor_name();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log
      (entity, action, role_id, role_label, role_key, after_data, actor_id, actor_name)
    VALUES
      ('role', 'created', NEW.id, NEW.label, NEW.key, to_jsonb(NEW), v_actor, v_actor_name);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      INSERT INTO public.role_audit_log
        (entity, action, role_id, role_label, role_key, before_data, after_data, actor_id, actor_name)
      VALUES
        ('role', 'updated', NEW.id, NEW.label, NEW.key, to_jsonb(OLD), to_jsonb(NEW), v_actor, v_actor_name);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log
      (entity, action, role_id, role_label, role_key, before_data, actor_id, actor_name)
    VALUES
      ('role', 'deleted', OLD.id, OLD.label, OLD.key, to_jsonb(OLD), v_actor, v_actor_name);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_roles_changes ON public.roles;
CREATE TRIGGER trg_audit_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.audit_roles_changes();

-- Trigger fn for role_capabilities
CREATE OR REPLACE FUNCTION public.audit_role_capabilities_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_actor_name text := public.audit_current_actor_name();
  v_role_id uuid;
  v_label text;
  v_key text;
  v_action text;
  v_cap text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_role_id := NEW.role_id; v_cap := NEW.capability;
    v_action := CASE WHEN NEW.allowed THEN 'granted' ELSE 'revoked' END;
  ELSIF TG_OP = 'UPDATE' THEN
    v_role_id := NEW.role_id; v_cap := NEW.capability;
    IF OLD.allowed = NEW.allowed THEN
      RETURN NEW;
    END IF;
    v_action := CASE WHEN NEW.allowed THEN 'granted' ELSE 'revoked' END;
  ELSE
    v_role_id := OLD.role_id; v_cap := OLD.capability;
    v_action := 'revoked';
  END IF;

  SELECT label, key INTO v_label, v_key FROM public.roles WHERE id = v_role_id;

  INSERT INTO public.role_audit_log
    (entity, action, role_id, role_label, role_key, capability, before_data, after_data, actor_id, actor_name)
  VALUES
    ('role_capability', v_action, v_role_id, v_label, v_key, v_cap,
     CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
     CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
     v_actor, v_actor_name);

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_role_capabilities_changes ON public.role_capabilities;
CREATE TRIGGER trg_audit_role_capabilities_changes
AFTER INSERT OR UPDATE OR DELETE ON public.role_capabilities
FOR EACH ROW EXECUTE FUNCTION public.audit_role_capabilities_changes();