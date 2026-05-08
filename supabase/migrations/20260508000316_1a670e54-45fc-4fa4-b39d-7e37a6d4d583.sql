
-- =========================================================
-- FASE 2: Sincronização bidirecional (não-destrutiva)
-- =========================================================

-- 1) Trigger profiles: manter role <-> role_id sincronizados
CREATE OR REPLACE FUNCTION public.sync_profile_role_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_key text;
  v_role_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Se role_id veio preenchido, role enum espelha
    IF NEW.role_id IS NOT NULL THEN
      SELECT key INTO v_role_key FROM public.roles WHERE id = NEW.role_id;
      IF v_role_key IS NOT NULL THEN
        BEGIN
          NEW.role := v_role_key::user_role;
        EXCEPTION WHEN invalid_text_representation THEN
          -- papel customizado fora do enum; mantém role atual
          NULL;
        END;
      END IF;
    ELSIF NEW.role IS NOT NULL THEN
      SELECT id INTO v_role_id FROM public.roles WHERE key = NEW.role::text;
      NEW.role_id := v_role_id;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role_id IS DISTINCT FROM OLD.role_id THEN
    SELECT key INTO v_role_key FROM public.roles WHERE id = NEW.role_id;
    IF v_role_key IS NOT NULL THEN
      BEGIN
        NEW.role := v_role_key::user_role;
      EXCEPTION WHEN invalid_text_representation THEN
        NULL;
      END;
    END IF;
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT id INTO v_role_id FROM public.roles WHERE key = NEW.role::text;
    IF v_role_id IS NOT NULL THEN
      NEW.role_id := v_role_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_role_columns ON public.profiles;
CREATE TRIGGER trg_sync_profile_role_columns
BEFORE INSERT OR UPDATE OF role, role_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_columns();

-- 2) Atualizar handle_new_user para preencher role_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_count INTEGER;
  user_role_value user_role;
  v_role_id uuid;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;

  user_role_value := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    CASE
      WHEN profile_count = 0 THEN 'diretor'::user_role
      ELSE 'aluno'::user_role
    END
  );

  SELECT id INTO v_role_id FROM public.roles WHERE key = user_role_value::text;

  INSERT INTO public.profiles (user_id, full_name, role, role_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
    user_role_value,
    v_role_id
  );

  RETURN NEW;
END;
$$;

-- 3) Sincronizar role_capabilities -> role_module_access
-- Mapeamento estático modulo -> capability necessária para SELECT
CREATE OR REPLACE FUNCTION public.module_to_capability(_module text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE _module
    WHEN 'students'              THEN 'students.read'
    WHEN 'calendar'              THEN 'calendar.read'
    WHEN 'inventory'             THEN 'inventory.read'
    WHEN 'purchases'             THEN 'purchases.read'
    WHEN 'suppliers'             THEN 'suppliers.read'
    WHEN 'reports'               THEN 'reports.read'
    WHEN 'tasks'                 THEN 'tasks.read'
    WHEN 'users'                 THEN 'users.manage'
    WHEN 'annotation_categories' THEN 'aux_tables.manage'
    WHEN 'dashboard'             THEN NULL  -- sempre permitido
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.sync_role_module_access(_role_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_key text;
  v_role user_role;
  v_module text;
  v_cap text;
  v_allowed boolean;
BEGIN
  SELECT key INTO v_role_key FROM public.roles WHERE id = _role_id;
  IF v_role_key IS NULL THEN RETURN; END IF;

  -- Só sincroniza para papéis que existem no enum (system roles)
  BEGIN
    v_role := v_role_key::user_role;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN; -- papel custom: role_module_access não suporta
  END;

  FOR v_module IN
    SELECT unnest(ARRAY[
      'students','calendar','inventory','purchases','suppliers',
      'reports','tasks','users','annotation_categories','dashboard'
    ])
  LOOP
    v_cap := public.module_to_capability(v_module);
    IF v_cap IS NULL THEN
      v_allowed := true; -- dashboard: sempre permitido
    ELSE
      SELECT COALESCE(bool_or(allowed), false) INTO v_allowed
      FROM public.role_capabilities
      WHERE role_id = _role_id AND capability = v_cap;
    END IF;

    INSERT INTO public.role_module_access (role, module, allowed)
    VALUES (v_role, v_module, v_allowed)
    ON CONFLICT (role, module) DO UPDATE SET
      allowed = EXCLUDED.allowed,
      updated_at = now();
  END LOOP;
END;
$$;

-- Garantir UNIQUE em role_module_access(role, module) para o ON CONFLICT funcionar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'role_module_access_role_module_key'
  ) THEN
    BEGIN
      ALTER TABLE public.role_module_access
        ADD CONSTRAINT role_module_access_role_module_key UNIQUE (role, module);
    EXCEPTION WHEN duplicate_table OR unique_violation THEN
      NULL;
    END;
  END IF;
END $$;

-- Trigger em role_capabilities
CREATE OR REPLACE FUNCTION public.trg_role_capabilities_sync_module_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_role_module_access(OLD.role_id);
    RETURN OLD;
  ELSE
    PERFORM public.sync_role_module_access(NEW.role_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_role_caps_sync_module ON public.role_capabilities;
CREATE TRIGGER trg_role_caps_sync_module
AFTER INSERT OR UPDATE OR DELETE ON public.role_capabilities
FOR EACH ROW EXECUTE FUNCTION public.trg_role_capabilities_sync_module_access();

-- 4) Backfill inicial: rodar sync para todos os papéis de sistema
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.roles WHERE is_system = true LOOP
    PERFORM public.sync_role_module_access(r.id);
  END LOOP;
END $$;
