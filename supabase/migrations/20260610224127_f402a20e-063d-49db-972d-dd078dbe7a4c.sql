
-- =====================================================
-- Módulo: Controle de Pendências (Kanban)
-- =====================================================

-- Helper: verifica se é coordenador, diretor ou admin
CREATE OR REPLACE FUNCTION public.is_coordinator_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.roles r ON r.id = p.role_id
    WHERE p.user_id = _user_id
      AND p.active = true
      AND r.key IN ('coordenador', 'diretor', 'administrador')
  );
$$;

-- =========================
-- 1. BOARDS
-- =========================
CREATE TABLE public.pendency_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cor text DEFAULT '#3b82f6',
  is_default boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_boards TO authenticated;
GRANT ALL ON public.pendency_boards TO service_role;
ALTER TABLE public.pendency_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read boards"
  ON public.pendency_boards FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators manage boards"
  ON public.pendency_boards FOR ALL TO authenticated
  USING (public.is_coordinator_or_above(auth.uid()))
  WITH CHECK (public.is_coordinator_or_above(auth.uid()));

CREATE TRIGGER trg_pendency_boards_updated
  BEFORE UPDATE ON public.pendency_boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 2. COLUMNS
-- =========================
CREATE TYPE public.pendency_column_kind AS ENUM ('open','done','rejected','blocked');

CREATE TABLE public.pendency_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.pendency_boards(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cor text DEFAULT '#94a3b8',
  posicao integer NOT NULL DEFAULT 0,
  wip_limit integer,
  is_final boolean NOT NULL DEFAULT false,
  kind public.pendency_column_kind NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pendency_columns_board ON public.pendency_columns(board_id, posicao);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_columns TO authenticated;
GRANT ALL ON public.pendency_columns TO service_role;
ALTER TABLE public.pendency_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read columns"
  ON public.pendency_columns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators manage columns"
  ON public.pendency_columns FOR ALL TO authenticated
  USING (public.is_coordinator_or_above(auth.uid()))
  WITH CHECK (public.is_coordinator_or_above(auth.uid()));

CREATE TRIGGER trg_pendency_columns_updated
  BEFORE UPDATE ON public.pendency_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 3. CATEGORIES (auxiliar)
-- =========================
CREATE TABLE public.pendency_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  cor text DEFAULT '#64748b',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_categories TO authenticated;
GRANT ALL ON public.pendency_categories TO service_role;
ALTER TABLE public.pendency_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read categories"
  ON public.pendency_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators manage categories"
  ON public.pendency_categories FOR ALL TO authenticated
  USING (public.is_coordinator_or_above(auth.uid()))
  WITH CHECK (public.is_coordinator_or_above(auth.uid()));

CREATE TRIGGER trg_pendency_categories_updated
  BEFORE UPDATE ON public.pendency_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 4. PENDENCIES
-- =========================
CREATE TYPE public.pendency_priority AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE public.pendency_acceptance AS ENUM ('pendente','aceita','rejeitada');

CREATE TABLE public.pendencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.pendency_boards(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.pendency_columns(id) ON DELETE RESTRICT,
  posicao integer NOT NULL DEFAULT 0,
  titulo text NOT NULL,
  descricao text,
  solicitante_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,
  setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES public.pendency_categories(id) ON DELETE SET NULL,
  prioridade public.pendency_priority NOT NULL DEFAULT 'media',
  status_aceite public.pendency_acceptance NOT NULL DEFAULT 'pendente',
  data_aceite timestamptz,
  motivo_rejeicao text,
  prazo date,
  data_entrega timestamptz,
  dep_setor_id uuid REFERENCES public.setores(id) ON DELETE SET NULL,
  dep_responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dep_descricao text,
  esforco_estimado numeric,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pendencies_board_column ON public.pendencies(board_id, column_id, posicao);
CREATE INDEX idx_pendencies_responsavel ON public.pendencies(responsavel_id);
CREATE INDEX idx_pendencies_solicitante ON public.pendencies(solicitante_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendencies TO authenticated;
GRANT ALL ON public.pendencies TO service_role;
ALTER TABLE public.pendencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read pendencies if coord/owner/responsible"
  ON public.pendencies FOR SELECT TO authenticated
  USING (
    public.is_coordinator_or_above(auth.uid())
    OR solicitante_id = auth.uid()
    OR responsavel_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated can create pendencies"
  ON public.pendencies FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Update if coord or owner/responsible"
  ON public.pendencies FOR UPDATE TO authenticated
  USING (
    public.is_coordinator_or_above(auth.uid())
    OR solicitante_id = auth.uid()
    OR responsavel_id = auth.uid()
    OR created_by = auth.uid()
  );

CREATE POLICY "Delete only coordinators"
  ON public.pendencies FOR DELETE TO authenticated
  USING (public.is_coordinator_or_above(auth.uid()));

CREATE TRIGGER trg_pendencies_updated
  BEFORE UPDATE ON public.pendencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger lógica de negócio
CREATE OR REPLACE FUNCTION public.pendency_business_rules()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind public.pendency_column_kind;
  v_blocked_col uuid;
  v_done_col uuid;
BEGIN
  -- Aceite/rejeição
  IF TG_OP = 'INSERT' OR NEW.status_aceite IS DISTINCT FROM OLD.status_aceite THEN
    IF NEW.status_aceite IN ('aceita','rejeitada') AND NEW.data_aceite IS NULL THEN
      NEW.data_aceite := now();
    END IF;
    IF NEW.status_aceite = 'rejeitada' AND (NEW.motivo_rejeicao IS NULL OR length(trim(NEW.motivo_rejeicao)) = 0) THEN
      RAISE EXCEPTION 'Motivo da rejeição é obrigatório.';
    END IF;
  END IF;

  -- Dependência preenchida → move para coluna 'blocked' se existir
  IF TG_OP = 'UPDATE'
     AND (NEW.dep_setor_id IS NOT NULL OR NEW.dep_responsavel_id IS NOT NULL)
     AND (OLD.dep_setor_id IS NULL AND OLD.dep_responsavel_id IS NULL)
  THEN
    SELECT id INTO v_blocked_col FROM public.pendency_columns
      WHERE board_id = NEW.board_id AND kind = 'blocked'
      ORDER BY posicao LIMIT 1;
    IF v_blocked_col IS NOT NULL THEN
      NEW.column_id := v_blocked_col;
    END IF;
  END IF;

  -- Mudou de coluna → se entrou em 'done', marca data_entrega
  IF TG_OP = 'UPDATE' AND NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    SELECT kind INTO v_kind FROM public.pendency_columns WHERE id = NEW.column_id;
    IF v_kind = 'done' AND NEW.data_entrega IS NULL THEN
      NEW.data_entrega := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pendency_business
  BEFORE INSERT OR UPDATE ON public.pendencies
  FOR EACH ROW EXECUTE FUNCTION public.pendency_business_rules();

-- =========================
-- 5. TAGS
-- =========================
CREATE TABLE public.pendency_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.pendency_boards(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cor text DEFAULT '#64748b',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(board_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_tags TO authenticated;
GRANT ALL ON public.pendency_tags TO service_role;
ALTER TABLE public.pendency_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tags" ON public.pendency_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coordinators manage tags" ON public.pendency_tags FOR ALL TO authenticated
  USING (public.is_coordinator_or_above(auth.uid()))
  WITH CHECK (public.is_coordinator_or_above(auth.uid()));

CREATE TABLE public.pendency_tag_links (
  pendency_id uuid NOT NULL REFERENCES public.pendencies(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.pendency_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (pendency_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_tag_links TO authenticated;
GRANT ALL ON public.pendency_tag_links TO service_role;
ALTER TABLE public.pendency_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read tag links" ON public.pendency_tag_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage tag links" ON public.pendency_tag_links FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pendencies p WHERE p.id = pendency_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pendencies p WHERE p.id = pendency_id));

-- =========================
-- 6. CHECKLIST
-- =========================
CREATE TABLE public.pendency_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id uuid NOT NULL REFERENCES public.pendencies(id) ON DELETE CASCADE,
  texto text NOT NULL,
  concluido boolean NOT NULL DEFAULT false,
  posicao integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pendency_checklist_pendency ON public.pendency_checklist_items(pendency_id, posicao);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_checklist_items TO authenticated;
GRANT ALL ON public.pendency_checklist_items TO service_role;
ALTER TABLE public.pendency_checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read checklist" ON public.pendency_checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage checklist" ON public.pendency_checklist_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pendencies p WHERE p.id = pendency_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pendencies p WHERE p.id = pendency_id));
CREATE TRIGGER trg_pendency_checklist_updated
  BEFORE UPDATE ON public.pendency_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 7. COMMENTS
-- =========================
CREATE TABLE public.pendency_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id uuid NOT NULL REFERENCES public.pendencies(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pendency_comments_pendency ON public.pendency_comments(pendency_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_comments TO authenticated;
GRANT ALL ON public.pendency_comments TO service_role;
ALTER TABLE public.pendency_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read comments" ON public.pendency_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create comments" ON public.pendency_comments FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid());
CREATE POLICY "Update own comment" ON public.pendency_comments FOR UPDATE TO authenticated
  USING (autor_id = auth.uid());
CREATE POLICY "Delete own or coord" ON public.pendency_comments FOR DELETE TO authenticated
  USING (autor_id = auth.uid() OR public.is_coordinator_or_above(auth.uid()));

-- =========================
-- 8. ATTACHMENTS
-- =========================
CREATE TABLE public.pendency_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id uuid NOT NULL REFERENCES public.pendencies(id) ON DELETE CASCADE,
  nome text NOT NULL,
  storage_path text NOT NULL,
  mime text,
  tamanho bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pendency_attachments_pendency ON public.pendency_attachments(pendency_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pendency_attachments TO authenticated;
GRANT ALL ON public.pendency_attachments TO service_role;
ALTER TABLE public.pendency_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read attachments" ON public.pendency_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Upload attachments" ON public.pendency_attachments FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Delete own attachments or coord" ON public.pendency_attachments FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_coordinator_or_above(auth.uid()));

-- =========================
-- 9. ACTIVITY LOG
-- =========================
CREATE TABLE public.pendency_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id uuid NOT NULL REFERENCES public.pendencies(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acao text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pendency_activity_pendency ON public.pendency_activity_log(pendency_id, created_at);
GRANT SELECT, INSERT ON public.pendency_activity_log TO authenticated;
GRANT ALL ON public.pendency_activity_log TO service_role;
ALTER TABLE public.pendency_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read activity" ON public.pendency_activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert activity" ON public.pendency_activity_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Trigger de log automático
CREATE OR REPLACE FUNCTION public.pendency_log_changes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'created', jsonb_build_object('titulo', NEW.titulo));
    RETURN NEW;
  END IF;
  IF NEW.column_id IS DISTINCT FROM OLD.column_id THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'moved', jsonb_build_object('from', OLD.column_id, 'to', NEW.column_id));
  END IF;
  IF NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'assigned', jsonb_build_object('responsavel_id', NEW.responsavel_id));
  END IF;
  IF NEW.status_aceite IS DISTINCT FROM OLD.status_aceite THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, NEW.status_aceite::text, jsonb_build_object('motivo', NEW.motivo_rejeicao));
  END IF;
  IF NEW.data_entrega IS DISTINCT FROM OLD.data_entrega AND NEW.data_entrega IS NOT NULL THEN
    INSERT INTO public.pendency_activity_log(pendency_id, autor_id, acao, payload)
    VALUES (NEW.id, v_actor, 'completed', jsonb_build_object('data_entrega', NEW.data_entrega));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pendency_log
  AFTER INSERT OR UPDATE ON public.pendencies
  FOR EACH ROW EXECUTE FUNCTION public.pendency_log_changes();

-- =========================
-- 10. NOTIFICAÇÕES
-- =========================
-- Adicionar valores ao enum de notification type, se ainda não existirem
DO $$
DECLARE
  vals text[] := ARRAY['pendency_assigned','pendency_accepted','pendency_rejected','pendency_blocked','pendency_completed','pendency_commented'];
  v text;
BEGIN
  FOREACH v IN ARRAY vals LOOP
    BEGIN
      EXECUTE format('ALTER TYPE notification_type ADD VALUE IF NOT EXISTS %L', v);
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION public.pendency_notify()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.responsavel_id IS NOT NULL AND NEW.responsavel_id <> NEW.created_by THEN
    INSERT INTO public.notifications(user_id, type, reference_id, title, message)
    VALUES (NEW.responsavel_id, 'pendency_assigned', NEW.id, 'Nova pendência atribuída', 'Você foi designado para: ' || NEW.titulo);
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id AND NEW.responsavel_id IS NOT NULL AND NEW.responsavel_id <> auth.uid() THEN
      INSERT INTO public.notifications(user_id, type, reference_id, title, message)
      VALUES (NEW.responsavel_id, 'pendency_assigned', NEW.id, 'Pendência atribuída', 'Você foi designado para: ' || NEW.titulo);
    END IF;
    IF NEW.status_aceite = 'aceita' AND OLD.status_aceite <> 'aceita' AND NEW.solicitante_id IS NOT NULL AND NEW.solicitante_id <> auth.uid() THEN
      INSERT INTO public.notifications(user_id, type, reference_id, title, message)
      VALUES (NEW.solicitante_id, 'pendency_accepted', NEW.id, 'Pendência aceita', 'Sua pendência foi aceita: ' || NEW.titulo);
    END IF;
    IF NEW.status_aceite = 'rejeitada' AND OLD.status_aceite <> 'rejeitada' AND NEW.solicitante_id IS NOT NULL AND NEW.solicitante_id <> auth.uid() THEN
      INSERT INTO public.notifications(user_id, type, reference_id, title, message)
      VALUES (NEW.solicitante_id, 'pendency_rejected', NEW.id, 'Pendência rejeitada', 'Sua pendência foi rejeitada: ' || NEW.titulo);
    END IF;
    IF NEW.data_entrega IS DISTINCT FROM OLD.data_entrega AND NEW.data_entrega IS NOT NULL AND NEW.solicitante_id IS NOT NULL AND NEW.solicitante_id <> auth.uid() THEN
      INSERT INTO public.notifications(user_id, type, reference_id, title, message)
      VALUES (NEW.solicitante_id, 'pendency_completed', NEW.id, 'Pendência concluída', 'Sua pendência foi concluída: ' || NEW.titulo);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pendency_notify
  AFTER INSERT OR UPDATE ON public.pendencies
  FOR EACH ROW EXECUTE FUNCTION public.pendency_notify();

-- =========================
-- 11. CAPABILITIES & MODULE ACCESS
-- =========================
-- Liberar módulo "pendencies" no role_module_access para todos os roles do enum
INSERT INTO public.role_module_access (role, module, allowed) VALUES
  ('diretor','pendencies',true),
  ('coordenador','pendencies',true),
  ('administrador','pendencies',true),
  ('auxiliar','pendencies',true),
  ('aluno','pendencies',true)
ON CONFLICT (role, module) DO UPDATE SET allowed = EXCLUDED.allowed;

-- Capabilities granulares (apenas registra; gestão fica no admin de roles)
INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT r.id, c.cap, true
FROM public.roles r
CROSS JOIN (VALUES
  ('pendencies.read'),
  ('pendencies.create'),
  ('pendencies.update_own'),
  ('pendencies.manage_boards'),
  ('pendencies.assign'),
  ('pendencies.accept_reject'),
  ('pendencies.delete')
) AS c(cap)
WHERE
  (r.key IN ('diretor','administrador'))
  OR (r.key = 'coordenador' AND c.cap <> 'pendencies.delete')
  OR (r.key IN ('auxiliar','aluno') AND c.cap IN ('pendencies.read','pendencies.create','pendencies.update_own'))
ON CONFLICT (role_id, capability) DO NOTHING;

-- =========================
-- 12. SEED: quadro padrão
-- =========================
DO $$
DECLARE
  v_board uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.pendency_boards WHERE is_default = true) THEN
    INSERT INTO public.pendency_boards(nome, descricao, is_default, cor)
    VALUES ('Pendências dos Coordenadores', 'Quadro padrão de pendências da coordenação', true, '#3b82f6')
    RETURNING id INTO v_board;

    INSERT INTO public.pendency_columns(board_id, nome, cor, posicao, kind, is_final) VALUES
      (v_board, 'Backlog',      '#94a3b8', 0, 'open',     false),
      (v_board, 'Em Análise',   '#f59e0b', 1, 'open',     false),
      (v_board, 'Aceita',       '#06b6d4', 2, 'open',     false),
      (v_board, 'Em Execução',  '#3b82f6', 3, 'open',     false),
      (v_board, 'Bloqueada',    '#ef4444', 4, 'blocked',  false),
      (v_board, 'Concluída',    '#22c55e', 5, 'done',     true),
      (v_board, 'Rejeitada',    '#71717a', 6, 'rejected', true);
  END IF;

  -- Categorias iniciais
  INSERT INTO public.pendency_categories(nome, cor) VALUES
    ('Operacional', '#3b82f6'),
    ('Financeiro',  '#22c55e'),
    ('Recursos Humanos', '#a855f7'),
    ('Infraestrutura',   '#f97316'),
    ('Pedagógico',   '#06b6d4')
  ON CONFLICT (nome) DO NOTHING;
END$$;
