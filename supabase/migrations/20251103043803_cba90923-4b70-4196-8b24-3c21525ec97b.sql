-- =====================================================
-- COMPREHENSIVE RLS UPDATE: Add administrador role to all policies
-- =====================================================

-- 1. annotation_categories
DROP POLICY IF EXISTS "Administradores podem gerenciar categorias" ON annotation_categories;

CREATE POLICY "Administradores podem gerenciar categorias" 
ON annotation_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'administrador'::user_role
    ])
  )
);

-- 2. student_basic_data
DROP POLICY IF EXISTS "Authorized users can manage student basic data" ON student_basic_data;

CREATE POLICY "Authorized users can manage student basic data" 
ON student_basic_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_basic_data.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student data based on student permissions" ON student_basic_data;

CREATE POLICY "Users can view student data based on student permissions" 
ON student_basic_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_basic_data.student_id 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = s.user_id
    )
  )
);

-- 3. student_work_situation
DROP POLICY IF EXISTS "Authorized users can manage student work situation" ON student_work_situation;

CREATE POLICY "Authorized users can manage student work situation" 
ON student_work_situation 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_work_situation.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student work situation based on student permissi" ON student_work_situation;

CREATE POLICY "Users can view student work situation based on student permissi" 
ON student_work_situation 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_work_situation.student_id 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = s.user_id
    )
  )
);

-- 4. student_emergency_contacts
DROP POLICY IF EXISTS "Authorized users can manage student emergency contacts" ON student_emergency_contacts;

CREATE POLICY "Authorized users can manage student emergency contacts" 
ON student_emergency_contacts 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_emergency_contacts.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student emergency contacts based on student perm" ON student_emergency_contacts;

CREATE POLICY "Users can view student emergency contacts based on student perm" 
ON student_emergency_contacts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_emergency_contacts.student_id 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = s.user_id
    )
  )
);

-- 5. student_health_data
DROP POLICY IF EXISTS "Authorized users can manage student health data" ON student_health_data;

CREATE POLICY "Authorized users can manage student health data" 
ON student_health_data 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_health_data.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student health data based on student permissions" ON student_health_data;

CREATE POLICY "Users can view student health data based on student permissions" 
ON student_health_data 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_health_data.student_id 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = s.user_id
    )
  )
);

-- 6. student_annotations
DROP POLICY IF EXISTS "Authorized users can manage student annotations" ON student_annotations;

CREATE POLICY "Authorized users can manage student annotations" 
ON student_annotations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_annotations.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student annotations based on student permissions" ON student_annotations;

CREATE POLICY "Users can view student annotations based on student permissions" 
ON student_annotations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_annotations.student_id 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = s.user_id
    )
  )
);

-- 7. student_documents
DROP POLICY IF EXISTS "Authorized users can manage student documents" ON student_documents;

CREATE POLICY "Authorized users can manage student documents" 
ON student_documents 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_documents.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student documents based on student permissions" ON student_documents;

CREATE POLICY "Users can view student documents based on student permissions" 
ON student_documents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_documents.student_id 
    AND (
      p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role, 
        'auxiliar'::user_role,
        'administrador'::user_role
      ]) 
      OR p.user_id = s.user_id
    )
  )
);

-- 8. suppliers
DROP POLICY IF EXISTS "Coordinators and directors can manage suppliers" ON suppliers;

CREATE POLICY "Coordinators and directors can manage suppliers" 
ON suppliers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view suppliers based on permissions" ON suppliers;

CREATE POLICY "Users can view suppliers based on permissions" 
ON suppliers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 9. inventory_items
DROP POLICY IF EXISTS "Coordinators and directors can manage inventory items" ON inventory_items;

CREATE POLICY "Coordinators and directors can manage inventory items" 
ON inventory_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view inventory items based on permissions" ON inventory_items;

CREATE POLICY "Users can view inventory items based on permissions" 
ON inventory_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 10. inventory_movements
DROP POLICY IF EXISTS "Users can create inventory movements" ON inventory_movements;

CREATE POLICY "Users can create inventory movements" 
ON inventory_movements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view inventory movements based on permissions" ON inventory_movements;

CREATE POLICY "Users can view inventory movements based on permissions" 
ON inventory_movements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 11. purchase_orders
DROP POLICY IF EXISTS "Users can create purchase orders" ON purchase_orders;

CREATE POLICY "Users can create purchase orders" 
ON purchase_orders 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can update their own purchase orders" ON purchase_orders;

CREATE POLICY "Users can update their own purchase orders" 
ON purchase_orders 
FOR UPDATE 
USING (
  (created_by = auth.uid() AND status = 'pendente') 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view purchase orders based on permissions" ON purchase_orders;

CREATE POLICY "Users can view purchase orders based on permissions" 
ON purchase_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 12. purchase_order_items
DROP POLICY IF EXISTS "Users can manage purchase order items based on order permission" ON purchase_order_items;

CREATE POLICY "Users can manage purchase order items based on order permission" 
ON purchase_order_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM purchase_orders po
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE po.id = purchase_order_items.purchase_order_id 
    AND (
      (po.created_by = auth.uid() AND po.status = 'pendente') 
      OR p.role = ANY (ARRAY[
        'coordenador'::user_role, 
        'diretor'::user_role,
        'administrador'::user_role
      ])
    )
  )
);

DROP POLICY IF EXISTS "Users can view purchase order items based on order permissions" ON purchase_order_items;

CREATE POLICY "Users can view purchase order items based on order permissions" 
ON purchase_order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM purchase_orders po
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE po.id = purchase_order_items.purchase_order_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 13. tasks
DROP POLICY IF EXISTS "Users can update their own tasks or assigned tasks" ON tasks;

CREATE POLICY "Users can update their own tasks or assigned tasks" 
ON tasks 
FOR UPDATE 
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid() 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Only creators and admins can delete tasks" ON tasks;

CREATE POLICY "Only creators and admins can delete tasks" 
ON tasks 
FOR DELETE 
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view tasks assigned to them or created by them" ON tasks;

CREATE POLICY "Users can view tasks assigned to them or created by them" 
ON tasks 
FOR SELECT 
USING (
  assigned_to = auth.uid() 
  OR created_by = auth.uid() 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 14. task_comments
DROP POLICY IF EXISTS "Users can view comments on accessible tasks" ON task_comments;

CREATE POLICY "Users can view comments on accessible tasks" 
ON task_comments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM tasks t
    WHERE t.id = task_comments.task_id 
    AND (
      t.assigned_to = auth.uid() 
      OR t.created_by = auth.uid()
    )
  ) 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 15. task_attachments
DROP POLICY IF EXISTS "Users can view attachments on accessible tasks" ON task_attachments;

CREATE POLICY "Users can view attachments on accessible tasks" 
ON task_attachments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM tasks t
    WHERE t.id = task_attachments.task_id 
    AND (
      t.assigned_to = auth.uid() 
      OR t.created_by = auth.uid()
    )
  ) 
  OR EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role,
      'administrador'::user_role
    ])
  )
);

-- 16. calendar_events
DROP POLICY IF EXISTS "Users can create events" ON calendar_events;

CREATE POLICY "Users can create events" 
ON calendar_events 
FOR INSERT 
WITH CHECK (
  created_by = auth.uid() 
  AND EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);