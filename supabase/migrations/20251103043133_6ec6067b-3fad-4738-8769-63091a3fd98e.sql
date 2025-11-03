-- Update student_children policies to include administrador role
DROP POLICY IF EXISTS "Authorized users can manage student children" ON student_children;

CREATE POLICY "Authorized users can manage student children" 
ON student_children 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_children.student_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student children based on student permissions" ON student_children;

CREATE POLICY "Users can view student children based on student permissions" 
ON student_children 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE s.id = student_children.student_id 
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

-- Update student_children_list policies to include administrador role
DROP POLICY IF EXISTS "Authorized users can manage student children list" ON student_children_list;

CREATE POLICY "Authorized users can manage student children list" 
ON student_children_list 
FOR ALL 
USING (
  EXISTS (
    SELECT 1
    FROM student_children sc
    JOIN students s ON s.id = sc.student_id
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE sc.id = student_children_list.student_children_id 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

DROP POLICY IF EXISTS "Users can view student children list based on parent permission" ON student_children_list;

CREATE POLICY "Users can view student children list based on parent permission" 
ON student_children_list 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM student_children sc
    JOIN students s ON s.id = sc.student_id
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE sc.id = student_children_list.student_children_id 
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