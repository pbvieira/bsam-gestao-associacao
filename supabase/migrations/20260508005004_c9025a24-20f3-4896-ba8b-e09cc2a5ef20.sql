-- Protect deletion of essential capabilities and system roles
-- 1) Block delete/disable of role_capabilities row that would leave 0 active roles holding 'system.admin'
CREATE OR REPLACE FUNCTION public.prevent_last_capability_loss()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cap text;
  v_role_id uuid;
  v_remaining int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_cap := OLD.capability;
    v_role_id := OLD.role_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- só relevante se tirou allowed
    IF OLD.allowed = true AND NEW.allowed = false THEN
      v_cap := OLD.capability;
      v_role_id := OLD.role_id;
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  IF v_cap = 'system.admin' THEN
    SELECT COUNT(DISTINCT rc.role_id)
      INTO v_remaining
    FROM public.role_capabilities rc
    JOIN public.roles r ON r.id = rc.role_id
    WHERE rc.capability = 'system.admin'
      AND rc.allowed = true
      AND r.ativo = true
      AND rc.role_id <> v_role_id;

    IF v_remaining = 0 THEN
      RAISE EXCEPTION 'Não é possível remover system.admin: este é o último papel ativo com essa permissão.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_capability_loss ON public.role_capabilities;
CREATE TRIGGER trg_prevent_last_capability_loss
BEFORE UPDATE OR DELETE ON public.role_capabilities
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_capability_loss();

-- 2) Block delete/inactivation of roles with active users, and block any change that removes the last system.admin role
CREATE OR REPLACE FUNCTION public.prevent_unsafe_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_users int;
  v_remaining int;
  v_was_admin boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system = true THEN
      RAISE EXCEPTION 'Não é possível excluir uma função do sistema (%).', OLD.label;
    END IF;
    SELECT COUNT(*) INTO v_users FROM public.profiles WHERE role_id = OLD.id AND active = true;
    IF v_users > 0 THEN
      RAISE EXCEPTION 'Não é possível excluir a função "%": % usuário(s) ativo(s) ainda a utilizam.', OLD.label, v_users;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.role_capabilities
      WHERE role_id = OLD.id AND capability = 'system.admin' AND allowed = true
    ) INTO v_was_admin;

    IF v_was_admin THEN
      SELECT COUNT(DISTINCT rc.role_id)
        INTO v_remaining
      FROM public.role_capabilities rc
      JOIN public.roles r ON r.id = rc.role_id
      WHERE rc.capability = 'system.admin'
        AND rc.allowed = true
        AND r.ativo = true
        AND rc.role_id <> OLD.id;
      IF v_remaining = 0 THEN
        RAISE EXCEPTION 'Não é possível excluir esta função: é a última com system.admin.';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- inativando? mesmas regras
    IF OLD.ativo = true AND NEW.ativo = false THEN
      SELECT COUNT(*) INTO v_users FROM public.profiles WHERE role_id = OLD.id AND active = true;
      IF v_users > 0 THEN
        RAISE EXCEPTION 'Não é possível inativar a função "%": % usuário(s) ativo(s) ainda a utilizam.', OLD.label, v_users;
      END IF;

      SELECT EXISTS (
        SELECT 1 FROM public.role_capabilities
        WHERE role_id = OLD.id AND capability = 'system.admin' AND allowed = true
      ) INTO v_was_admin;

      IF v_was_admin THEN
        SELECT COUNT(DISTINCT rc.role_id)
          INTO v_remaining
        FROM public.role_capabilities rc
        JOIN public.roles r ON r.id = rc.role_id
        WHERE rc.capability = 'system.admin'
          AND rc.allowed = true
          AND r.ativo = true
          AND rc.role_id <> OLD.id;
        IF v_remaining = 0 THEN
          RAISE EXCEPTION 'Não é possível inativar esta função: é a última ativa com system.admin.';
        END IF;
      END IF;
    END IF;
    -- bloquear alteração de key e is_system
    IF NEW.key IS DISTINCT FROM OLD.key THEN
      RAISE EXCEPTION 'A chave técnica de uma função não pode ser alterada.';
    END IF;
    IF NEW.is_system IS DISTINCT FROM OLD.is_system THEN
      RAISE EXCEPTION 'O atributo is_system de uma função não pode ser alterado.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_unsafe_role_changes ON public.roles;
CREATE TRIGGER trg_prevent_unsafe_role_changes
BEFORE UPDATE OR DELETE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_unsafe_role_changes();