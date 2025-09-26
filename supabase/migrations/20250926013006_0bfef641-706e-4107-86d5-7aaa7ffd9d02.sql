-- Fix security warnings: Add missing RLS policies for all student tables

-- Policies for student_work_situation
CREATE POLICY "Users can view student work situation based on student permissions" ON public.student_work_situation
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_work_situation.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student work situation" ON public.student_work_situation
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_work_situation.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Policies for student_emergency_contacts
CREATE POLICY "Users can view student emergency contacts based on student permissions" ON public.student_emergency_contacts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_emergency_contacts.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student emergency contacts" ON public.student_emergency_contacts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_emergency_contacts.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Policies for student_health_data
CREATE POLICY "Users can view student health data based on student permissions" ON public.student_health_data
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_health_data.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student health data" ON public.student_health_data
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_health_data.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Policies for student_annotations
CREATE POLICY "Users can view student annotations based on student permissions" ON public.student_annotations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_annotations.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student annotations" ON public.student_annotations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_annotations.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Policies for student_documents
CREATE POLICY "Users can view student documents based on student permissions" ON public.student_documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_documents.student_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student documents" ON public.student_documents
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE s.id = student_documents.student_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Policies for student_children_list
CREATE POLICY "Users can view student children list based on parent permissions" ON public.student_children_list
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.student_children sc
    JOIN public.students s ON (s.id = sc.student_id)
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE sc.id = student_children_list.student_children_id
    AND (p.role IN ('coordenador', 'diretor', 'auxiliar') OR p.user_id = s.user_id)
  )
);

CREATE POLICY "Authorized users can manage student children list" ON public.student_children_list
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.student_children sc
    JOIN public.students s ON (s.id = sc.student_id)
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE sc.id = student_children_list.student_children_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);