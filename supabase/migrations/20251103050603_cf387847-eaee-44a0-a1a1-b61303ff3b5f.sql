-- Drop existing storage policies for student-documents bucket
DROP POLICY IF EXISTS "Authorized users can view student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can upload student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can update student documents" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete student documents" ON storage.objects;

-- Create new storage policies including administrador role

-- SELECT policy - View student documents
CREATE POLICY "Authorized users can view student documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'student-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- INSERT policy - Upload student documents
CREATE POLICY "Authorized users can upload student documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'student-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- UPDATE policy - Update student document metadata
CREATE POLICY "Authorized users can update student documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'student-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);

-- DELETE policy - Delete student documents
CREATE POLICY "Authorized users can delete student documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'student-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = ANY (ARRAY[
      'coordenador'::user_role, 
      'diretor'::user_role, 
      'auxiliar'::user_role,
      'administrador'::user_role
    ])
  )
);