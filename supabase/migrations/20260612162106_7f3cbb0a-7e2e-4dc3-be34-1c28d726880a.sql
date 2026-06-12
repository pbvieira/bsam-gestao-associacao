
-- Fix 1: Replace permissive INSERT policy on pendency_activity_log
DROP POLICY IF EXISTS "Insert activity" ON public.pendency_activity_log;
CREATE POLICY "Insert activity" ON public.pendency_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (autor_id = auth.uid() OR autor_id IS NULL);

-- Fix 2: Replace hardcoded-role storage policies for student-documents with capability checks
DROP POLICY IF EXISTS "Authorized users can view student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can upload student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete student documents" ON storage.objects;

CREATE POLICY "Authorized users can view student documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-documents' AND public.current_user_has_capability('students.read'));

CREATE POLICY "Authorized users can upload student documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-documents' AND public.current_user_has_capability('students.write'));

CREATE POLICY "Authorized users can update student documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-documents' AND public.current_user_has_capability('students.write'))
  WITH CHECK (bucket_id = 'student-documents' AND public.current_user_has_capability('students.write'));

CREATE POLICY "Authorized users can delete student documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-documents' AND public.current_user_has_capability('students.write'));
