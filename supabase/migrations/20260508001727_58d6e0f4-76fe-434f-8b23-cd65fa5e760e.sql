
-- =========================================================
-- FASE 3: Reescrita de TODAS as 80 RLS policies que dependiam
-- de comparação direta com user_role / get_current_user_role
-- / is_admin_user, substituindo por has_capability.
-- Comportamento preservado para os 5 papéis de sistema.
-- =========================================================

-- Helper local para legibilidade: usamos diretamente
--   public.current_user_has_capability(<cap>) e
--   public.has_capability(auth.uid(), <cap>)

-- ============ 4.1 TABELAS AUXILIARES / PARAMETRIZAÇÃO ============

DROP POLICY IF EXISTS "Administradores podem gerenciar categorias" ON public.annotation_categories;
CREATE POLICY "Administradores podem gerenciar categorias"
  ON public.annotation_categories FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar áreas" ON public.areas;
CREATE POLICY "Administradores podem gerenciar áreas"
  ON public.areas FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar tipos de benefício" ON public.benefit_types;
CREATE POLICY "Administradores podem gerenciar tipos de benefício"
  ON public.benefit_types FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar categorias de entrada" ON public.cash_book_entry_categories;
CREATE POLICY "Administradores podem gerenciar categorias de entrada"
  ON public.cash_book_entry_categories FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar categorias de saída" ON public.cash_book_exit_categories;
CREATE POLICY "Administradores podem gerenciar categorias de saída"
  ON public.cash_book_exit_categories FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar tipos de deficiências" ON public.disability_types;
CREATE POLICY "Administradores podem gerenciar tipos de deficiências"
  ON public.disability_types FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar tipos de doenças" ON public.disease_types;
CREATE POLICY "Administradores podem gerenciar tipos de doenças"
  ON public.disease_types FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar status" ON public.filiation_status;
CREATE POLICY "Administradores podem gerenciar status"
  ON public.filiation_status FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar tipos de renda" ON public.income_types;
CREATE POLICY "Administradores podem gerenciar tipos de renda"
  ON public.income_types FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar categorias" ON public.inventory_categories;
CREATE POLICY "Administradores podem gerenciar categorias"
  ON public.inventory_categories FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar tipos de uso" ON public.medication_usage_types;
CREATE POLICY "Administradores podem gerenciar tipos de uso"
  ON public.medication_usage_types FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar setores" ON public.setores;
CREATE POLICY "Administradores podem gerenciar setores"
  ON public.setores FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar tipos de vacinas" ON public.vaccine_types;
CREATE POLICY "Administradores podem gerenciar tipos de vacinas"
  ON public.vaccine_types FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Administradores podem gerenciar situações trabalhistas" ON public.work_situations;
CREATE POLICY "Administradores podem gerenciar situações trabalhistas"
  ON public.work_situations FOR ALL
  USING (public.current_user_has_capability('aux_tables.manage'))
  WITH CHECK (public.current_user_has_capability('aux_tables.manage'));

DROP POLICY IF EXISTS "Diretores e administradores podem gerenciar configurações" ON public.system_settings;
CREATE POLICY "Diretores e administradores podem gerenciar configurações"
  ON public.system_settings FOR ALL
  USING (public.current_user_has_capability('system.admin'))
  WITH CHECK (public.current_user_has_capability('system.admin'));

DROP POLICY IF EXISTS "Diretores e administradores podem gerenciar permissões" ON public.role_module_access;
CREATE POLICY "Diretores e administradores podem gerenciar permissões"
  ON public.role_module_access FOR ALL
  USING (public.current_user_has_capability('roles.manage'))
  WITH CHECK (public.current_user_has_capability('roles.manage'));

-- A SELECT policy "Usuários podem ver permissões de seu role" mantém-se;
-- ela depende do role enum local, ainda válido para system roles.

-- ============ 4.2 DOCUMENT TEMPLATES ============

DROP POLICY IF EXISTS "Admins can manage templates" ON public.document_templates;
CREATE POLICY "Admins can manage templates"
  ON public.document_templates FOR ALL
  TO authenticated
  USING (public.current_user_has_capability('documents.templates.manage'))
  WITH CHECK (public.current_user_has_capability('documents.templates.manage'));

-- ============ 4.3 CALENDAR ============

DROP POLICY IF EXISTS "Simple calendar events select policy" ON public.calendar_events;
CREATE POLICY "Simple calendar events select policy"
  ON public.calendar_events FOR SELECT
  USING (
    created_by = auth.uid()
    OR public.is_event_participant(id)
    OR public.current_user_has_capability('calendar.read')
  );

DROP POLICY IF EXISTS "Simple calendar events update policy" ON public.calendar_events;
CREATE POLICY "Simple calendar events update policy"
  ON public.calendar_events FOR UPDATE
  USING (
    created_by = auth.uid()
    OR public.current_user_has_capability('calendar.write')
  );

DROP POLICY IF EXISTS "Users can create events" ON public.calendar_events;
CREATE POLICY "Users can create events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND public.current_user_has_capability('calendar.write')
  );

DROP POLICY IF EXISTS "Event creators can manage participants" ON public.event_participants;
CREATE POLICY "Event creators can manage participants"
  ON public.event_participants FOR ALL
  USING (
    EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_participants.event_id AND ce.created_by = auth.uid())
    OR public.current_user_has_capability('calendar.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_participants.event_id AND ce.created_by = auth.uid())
    OR public.current_user_has_capability('calendar.write')
  );

DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;
CREATE POLICY "Users can view event participants"
  ON public.event_participants FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM calendar_events ce WHERE ce.id = event_participants.event_id AND ce.created_by = auth.uid())
    OR public.is_event_participant(event_id)
    OR public.current_user_has_capability('calendar.read')
  );

DROP POLICY IF EXISTS "Event organizers can manage external participants" ON public.external_event_participants;
CREATE POLICY "Event organizers can manage external participants"
  ON public.external_event_participants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = external_event_participants.event_id
        AND (ce.created_by = auth.uid() OR public.current_user_has_capability('calendar.write'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      WHERE ce.id = external_event_participants.event_id
        AND (ce.created_by = auth.uid() OR public.current_user_has_capability('calendar.write'))
    )
  );

-- ============ 4.4 INVENTORY & PURCHASES ============

DROP POLICY IF EXISTS "Coordinators and directors can manage inventory items" ON public.inventory_items;
CREATE POLICY "Coordinators and directors can manage inventory items"
  ON public.inventory_items FOR ALL
  USING (public.current_user_has_capability('inventory.manage'))
  WITH CHECK (public.current_user_has_capability('inventory.manage'));

DROP POLICY IF EXISTS "Users can view inventory items based on permissions" ON public.inventory_items;
CREATE POLICY "Users can view inventory items based on permissions"
  ON public.inventory_items FOR SELECT
  USING (public.current_user_has_capability('inventory.read'));

DROP POLICY IF EXISTS "Users can create inventory movements" ON public.inventory_movements;
CREATE POLICY "Users can create inventory movements"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (public.current_user_has_capability('inventory.write'));

DROP POLICY IF EXISTS "Users can view inventory movements based on permissions" ON public.inventory_movements;
CREATE POLICY "Users can view inventory movements based on permissions"
  ON public.inventory_movements FOR SELECT
  USING (public.current_user_has_capability('inventory.read'));

DROP POLICY IF EXISTS "Users can create purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can create purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (public.current_user_has_capability('purchases.write'));

DROP POLICY IF EXISTS "Users can update their own purchase orders" ON public.purchase_orders;
CREATE POLICY "Users can update their own purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (
    (created_by = auth.uid() AND status = 'pendente')
    OR public.current_user_has_capability('purchases.approve')
  );

DROP POLICY IF EXISTS "Users can view purchase orders based on permissions" ON public.purchase_orders;
CREATE POLICY "Users can view purchase orders based on permissions"
  ON public.purchase_orders FOR SELECT
  USING (public.current_user_has_capability('purchases.read'));

DROP POLICY IF EXISTS "Users can manage purchase order items based on order permission" ON public.purchase_order_items;
CREATE POLICY "Users can manage purchase order items based on order permission"
  ON public.purchase_order_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND (
          (po.created_by = auth.uid() AND po.status = 'pendente')
          OR public.current_user_has_capability('purchases.approve')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchase_orders po
      WHERE po.id = purchase_order_items.purchase_order_id
        AND (
          (po.created_by = auth.uid() AND po.status = 'pendente')
          OR public.current_user_has_capability('purchases.approve')
        )
    )
  );

DROP POLICY IF EXISTS "Users can view purchase order items based on order permissions" ON public.purchase_order_items;
CREATE POLICY "Users can view purchase order items based on order permissions"
  ON public.purchase_order_items FOR SELECT
  USING (public.current_user_has_capability('purchases.read'));

DROP POLICY IF EXISTS "Coordinators and directors can manage suppliers" ON public.suppliers;
CREATE POLICY "Coordinators and directors can manage suppliers"
  ON public.suppliers FOR ALL
  USING (public.current_user_has_capability('suppliers.manage'))
  WITH CHECK (public.current_user_has_capability('suppliers.manage'));

DROP POLICY IF EXISTS "Users can view suppliers based on permissions" ON public.suppliers;
CREATE POLICY "Users can view suppliers based on permissions"
  ON public.suppliers FOR SELECT
  USING (public.current_user_has_capability('suppliers.read'));

-- ============ 4.5 SAÚDE / MEDICAÇÃO ============

DROP POLICY IF EXISTS "Authorized users can manage appointment logs" ON public.medical_appointment_log;
CREATE POLICY "Authorized users can manage appointment logs"
  ON public.medical_appointment_log FOR ALL
  USING (public.current_user_has_capability('students.health.write'))
  WITH CHECK (public.current_user_has_capability('students.health.write'));

DROP POLICY IF EXISTS "Authorized users can view appointment logs" ON public.medical_appointment_log;
CREATE POLICY "Authorized users can view appointment logs"
  ON public.medical_appointment_log FOR SELECT
  USING (public.current_user_has_capability('students.health.read'));

DROP POLICY IF EXISTS "Authorized users can manage medication logs" ON public.medication_administration_log;
CREATE POLICY "Authorized users can manage medication logs"
  ON public.medication_administration_log FOR ALL
  USING (public.current_user_has_capability('medications.administer'))
  WITH CHECK (public.current_user_has_capability('medications.administer'));

DROP POLICY IF EXISTS "Authorized users can view medication logs" ON public.medication_administration_log;
CREATE POLICY "Authorized users can view medication logs"
  ON public.medication_administration_log FOR SELECT
  USING (public.current_user_has_capability('students.health.read'));

DROP POLICY IF EXISTS "Authorized users can manage medication schedules" ON public.medication_schedules;
CREATE POLICY "Authorized users can manage medication schedules"
  ON public.medication_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM student_medications sm
      WHERE sm.id = medication_schedules.medication_id
    ) AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM student_medications sm
      WHERE sm.id = medication_schedules.medication_id
    ) AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Authorized users can view medication schedules" ON public.medication_schedules;
CREATE POLICY "Authorized users can view medication schedules"
  ON public.medication_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM student_medications sm
      JOIN students s ON s.id = sm.student_id
      WHERE sm.id = medication_schedules.medication_id
        AND (
          public.current_user_has_capability('students.health.read')
          OR s.user_id = auth.uid()
        )
    )
  );

-- ============ 4.6 PROFILES ============

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.current_user_has_capability('users.manage') AND user_id <> auth.uid());

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.current_user_has_capability('users.manage'));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (role = 'aluno'::user_role OR public.current_user_has_capability('users.manage'))
  );

DROP POLICY IF EXISTS "Users can update profiles with admin access" ON public.profiles;
CREATE POLICY "Users can update profiles with admin access"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.current_user_has_capability('users.manage'))
  WITH CHECK (
    public.current_user_has_capability('users.manage')
    OR (
      auth.uid() = user_id
      AND role = (SELECT p.role FROM profiles p WHERE p.user_id = auth.uid())
      AND active = (SELECT p.active FROM profiles p WHERE p.user_id = auth.uid())
    )
  );

-- ============ 4.7 STUDENTS + tabelas-filhas ============

-- Macro: para cada par (manage ALL, view SELECT) trocar role-check por capability,
-- mantendo o fallback de "aluno vendo seus próprios dados" via JOIN students.

-- students
DROP POLICY IF EXISTS "Authorized users can insert students" ON public.students;
CREATE POLICY "Authorized users can insert students"
  ON public.students FOR INSERT
  WITH CHECK (public.current_user_has_capability('students.write'));

DROP POLICY IF EXISTS "Authorized users can update students" ON public.students;
CREATE POLICY "Authorized users can update students"
  ON public.students FOR UPDATE
  USING (public.current_user_has_capability('students.write'));

DROP POLICY IF EXISTS "Directors and administrators can delete students" ON public.students;
CREATE POLICY "Directors and administrators can delete students"
  ON public.students FOR DELETE
  USING (public.current_user_has_capability('students.delete'));

DROP POLICY IF EXISTS "Users can view students based on permissions" ON public.students;
CREATE POLICY "Users can view students based on permissions"
  ON public.students FOR SELECT
  USING (
    public.current_user_has_capability('students.read')
    OR user_id = auth.uid()
  );

-- helper macro implementado inline; capability default = students.write/read
-- exceções de capability tratadas separadamente abaixo.

-- student_basic_data (students.read/write)
DROP POLICY IF EXISTS "Authorized users can manage student basic data" ON public.student_basic_data;
CREATE POLICY "Authorized users can manage student basic data"
  ON public.student_basic_data FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_basic_data.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_basic_data.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student data based on student permissions" ON public.student_basic_data;
CREATE POLICY "Users can view student data based on student permissions"
  ON public.student_basic_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_basic_data.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- student_annotations
DROP POLICY IF EXISTS "Authorized users can manage student annotations" ON public.student_annotations;
CREATE POLICY "Authorized users can manage student annotations"
  ON public.student_annotations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_annotations.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_annotations.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student annotations based on student permissions" ON public.student_annotations;
CREATE POLICY "Users can view student annotations based on student permissions"
  ON public.student_annotations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_annotations.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- student_benefits_list (students.financial.*)
DROP POLICY IF EXISTS "Authorized users can manage student benefits list" ON public.student_benefits_list;
CREATE POLICY "Authorized users can manage student benefits list"
  ON public.student_benefits_list FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_benefits_list.student_id)
    AND public.current_user_has_capability('students.financial.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_benefits_list.student_id)
    AND public.current_user_has_capability('students.financial.write')
  );

DROP POLICY IF EXISTS "Users can view student benefits list" ON public.student_benefits_list;
CREATE POLICY "Users can view student benefits list"
  ON public.student_benefits_list FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_benefits_list.student_id
        AND (public.current_user_has_capability('students.financial.read') OR s.user_id = auth.uid())
    )
  );

-- student_cash_book (financial)
DROP POLICY IF EXISTS "Authorized users can manage student cash book" ON public.student_cash_book;
CREATE POLICY "Authorized users can manage student cash book"
  ON public.student_cash_book FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_cash_book.student_id)
    AND public.current_user_has_capability('students.financial.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_cash_book.student_id)
    AND public.current_user_has_capability('students.financial.write')
  );

DROP POLICY IF EXISTS "Users can view student cash book" ON public.student_cash_book;
CREATE POLICY "Users can view student cash book"
  ON public.student_cash_book FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_cash_book.student_id
        AND (public.current_user_has_capability('students.financial.read') OR s.user_id = auth.uid())
    )
  );

-- student_children
DROP POLICY IF EXISTS "Authorized users can manage student children" ON public.student_children;
CREATE POLICY "Authorized users can manage student children"
  ON public.student_children FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_children.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_children.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student children based on student permissions" ON public.student_children;
CREATE POLICY "Users can view student children based on student permissions"
  ON public.student_children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_children.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- student_children_list (filho de student_children)
DROP POLICY IF EXISTS "Authorized users can manage student children list" ON public.student_children_list;
CREATE POLICY "Authorized users can manage student children list"
  ON public.student_children_list FOR ALL
  USING (public.current_user_has_capability('students.write'))
  WITH CHECK (public.current_user_has_capability('students.write'));

DROP POLICY IF EXISTS "Users can view student children list based on parent permission" ON public.student_children_list;
CREATE POLICY "Users can view student children list based on parent permission"
  ON public.student_children_list FOR SELECT
  USING (public.current_user_has_capability('students.read'));

-- student_disabilities (health)
DROP POLICY IF EXISTS "Authorized users can manage student disabilities" ON public.student_disabilities;
CREATE POLICY "Authorized users can manage student disabilities"
  ON public.student_disabilities FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_disabilities.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_disabilities.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Users can view student disabilities based on permissions" ON public.student_disabilities;
CREATE POLICY "Users can view student disabilities based on permissions"
  ON public.student_disabilities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_disabilities.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_diseases (health)
DROP POLICY IF EXISTS "Authorized users can manage student diseases" ON public.student_diseases;
CREATE POLICY "Authorized users can manage student diseases"
  ON public.student_diseases FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_diseases.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_diseases.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Users can view student diseases based on permissions" ON public.student_diseases;
CREATE POLICY "Users can view student diseases based on permissions"
  ON public.student_diseases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_diseases.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_documents (general students.*)
DROP POLICY IF EXISTS "Authorized users can manage student documents" ON public.student_documents;
CREATE POLICY "Authorized users can manage student documents"
  ON public.student_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_documents.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_documents.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student documents based on student permissions" ON public.student_documents;
CREATE POLICY "Users can view student documents based on student permissions"
  ON public.student_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_documents.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- student_emergency_contacts
DROP POLICY IF EXISTS "Authorized users can manage student emergency contacts" ON public.student_emergency_contacts;
CREATE POLICY "Authorized users can manage student emergency contacts"
  ON public.student_emergency_contacts FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_emergency_contacts.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_emergency_contacts.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student emergency contacts based on student perm" ON public.student_emergency_contacts;
CREATE POLICY "Users can view student emergency contacts based on student perm"
  ON public.student_emergency_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_emergency_contacts.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- student_health_data (health)
DROP POLICY IF EXISTS "Authorized users can manage student health data" ON public.student_health_data;
CREATE POLICY "Authorized users can manage student health data"
  ON public.student_health_data FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_health_data.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_health_data.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Users can view student health data based on student permissions" ON public.student_health_data;
CREATE POLICY "Users can view student health data based on student permissions"
  ON public.student_health_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_health_data.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_hospitalizations (health)
DROP POLICY IF EXISTS "Authorized users can manage student hospitalizations" ON public.student_hospitalizations;
CREATE POLICY "Authorized users can manage student hospitalizations"
  ON public.student_hospitalizations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_hospitalizations.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_hospitalizations.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Users can view student hospitalizations based on permissions" ON public.student_hospitalizations;
CREATE POLICY "Users can view student hospitalizations based on permissions"
  ON public.student_hospitalizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_hospitalizations.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_income_list (financial)
DROP POLICY IF EXISTS "Authorized users can manage student income list" ON public.student_income_list;
CREATE POLICY "Authorized users can manage student income list"
  ON public.student_income_list FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_income_list.student_id)
    AND public.current_user_has_capability('students.financial.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_income_list.student_id)
    AND public.current_user_has_capability('students.financial.write')
  );

DROP POLICY IF EXISTS "Users can view student income list" ON public.student_income_list;
CREATE POLICY "Users can view student income list"
  ON public.student_income_list FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_income_list.student_id
        AND (public.current_user_has_capability('students.financial.read') OR s.user_id = auth.uid())
    )
  );

-- student_medical_records (health)
DROP POLICY IF EXISTS "Authorized users can manage student medical records" ON public.student_medical_records;
CREATE POLICY "Authorized users can manage student medical records"
  ON public.student_medical_records FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_medical_records.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_medical_records.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Users can view student medical records based on permissions" ON public.student_medical_records;
CREATE POLICY "Users can view student medical records based on permissions"
  ON public.student_medical_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_medical_records.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_medications (health)
DROP POLICY IF EXISTS "Authorized users can manage student medications" ON public.student_medications;
CREATE POLICY "Authorized users can manage student medications"
  ON public.student_medications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_medications.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_medications.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Authorized users can view student medications" ON public.student_medications;
CREATE POLICY "Authorized users can view student medications"
  ON public.student_medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_medications.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_stays
DROP POLICY IF EXISTS "Authorized users can manage student stays" ON public.student_stays;
CREATE POLICY "Authorized users can manage student stays"
  ON public.student_stays FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_stays.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_stays.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student stays" ON public.student_stays;
CREATE POLICY "Users can view student stays"
  ON public.student_stays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_stays.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- student_vaccines (health)
DROP POLICY IF EXISTS "Authorized users can manage student vaccines" ON public.student_vaccines;
CREATE POLICY "Authorized users can manage student vaccines"
  ON public.student_vaccines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_vaccines.student_id)
    AND public.current_user_has_capability('students.health.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_vaccines.student_id)
    AND public.current_user_has_capability('students.health.write')
  );

DROP POLICY IF EXISTS "Users can view student vaccines based on permissions" ON public.student_vaccines;
CREATE POLICY "Users can view student vaccines based on permissions"
  ON public.student_vaccines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_vaccines.student_id
        AND (public.current_user_has_capability('students.health.read') OR s.user_id = auth.uid())
    )
  );

-- student_work_situation
DROP POLICY IF EXISTS "Authorized users can manage student work situation" ON public.student_work_situation;
CREATE POLICY "Authorized users can manage student work situation"
  ON public.student_work_situation FOR ALL
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_work_situation.student_id)
    AND public.current_user_has_capability('students.write')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_work_situation.student_id)
    AND public.current_user_has_capability('students.write')
  );

DROP POLICY IF EXISTS "Users can view student work situation based on student permissi" ON public.student_work_situation;
CREATE POLICY "Users can view student work situation based on student permissi"
  ON public.student_work_situation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = student_work_situation.student_id
        AND (public.current_user_has_capability('students.read') OR s.user_id = auth.uid())
    )
  );

-- ============ 4.8 TASKS ============

DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (created_by = auth.uid() AND public.current_user_has_capability('tasks.write'));

DROP POLICY IF EXISTS "Users can update their own tasks or assigned tasks" ON public.tasks;
CREATE POLICY "Users can update their own tasks or assigned tasks"
  ON public.tasks FOR UPDATE
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.current_user_has_capability('tasks.write')
  );

DROP POLICY IF EXISTS "Users can view tasks assigned to them or created by them" ON public.tasks;
CREATE POLICY "Users can view tasks assigned to them or created by them"
  ON public.tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.current_user_has_capability('tasks.read')
  );

DROP POLICY IF EXISTS "Only creators and admins can delete tasks" ON public.tasks;
CREATE POLICY "Only creators and admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (created_by = auth.uid() OR public.current_user_has_capability('tasks.delete'));

DROP POLICY IF EXISTS "Users can view attachments on accessible tasks" ON public.task_attachments;
CREATE POLICY "Users can view attachments on accessible tasks"
  ON public.task_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_attachments.task_id
        AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
    )
    OR public.current_user_has_capability('tasks.read')
  );

DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON public.task_comments;
CREATE POLICY "Users can view comments on accessible tasks"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = task_comments.task_id
        AND (t.assigned_to = auth.uid() OR t.created_by = auth.uid())
    )
    OR public.current_user_has_capability('tasks.read')
  );

-- ============ Atualização de funções legadas para wrappers ============

-- is_admin_user agora baseado em capability system.admin OR users.manage,
-- preservando comportamento atual (administrador/diretor/coordenador eram admins).
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_capability(check_user_id, 'system.admin')
      OR public.has_capability(check_user_id, 'users.manage');
$$;

-- count_active_admins -> redireciona para system admins
CREATE OR REPLACE FUNCTION public.count_active_admins()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.count_active_system_admins();
$$;

-- prevent_last_admin_deletion: usar count_active_system_admins
CREATE OR REPLACE FUNCTION public.prevent_last_admin_deletion()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Desativando um system admin?
  IF OLD.active = true AND NEW.active = false
     AND public.has_capability(OLD.user_id, 'system.admin') THEN
    IF (SELECT public.count_active_system_admins()) <= 1 THEN
      RAISE EXCEPTION 'Não é possível desativar o último administrador do sistema.';
    END IF;
  END IF;

  -- Mudou de papel e perdeu system.admin?
  IF OLD.role_id IS DISTINCT FROM NEW.role_id
     AND OLD.active = true
     AND public.has_capability(OLD.user_id, 'system.admin') THEN
    -- has_capability ainda usa o role_id antigo via OLD; checar se o novo papel mantém system.admin
    IF NOT EXISTS (
      SELECT 1 FROM public.role_capabilities rc
      WHERE rc.role_id = NEW.role_id
        AND rc.capability = 'system.admin' AND rc.allowed = true
    ) AND (SELECT public.count_active_system_admins()) <= 1 THEN
      RAISE EXCEPTION 'Não é possível alterar o papel do último administrador.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
