-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-documents', 'student-documents', false);

-- Create storage policies for student documents
CREATE POLICY "Authorized users can view student documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'student-documents' AND 
       EXISTS (
         SELECT 1 FROM public.profiles p 
         WHERE p.user_id = auth.uid() 
         AND p.role IN ('coordenador', 'diretor', 'auxiliar')
       ));

CREATE POLICY "Authorized users can upload student documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'student-documents' AND 
            EXISTS (
              SELECT 1 FROM public.profiles p 
              WHERE p.user_id = auth.uid() 
              AND p.role IN ('coordenador', 'diretor', 'auxiliar')
            ));

CREATE POLICY "Authorized users can update student documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'student-documents' AND 
       EXISTS (
         SELECT 1 FROM public.profiles p 
         WHERE p.user_id = auth.uid() 
         AND p.role IN ('coordenador', 'diretor', 'auxiliar')
       ));

CREATE POLICY "Authorized users can delete student documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'student-documents' AND 
       EXISTS (
         SELECT 1 FROM public.profiles p 
         WHERE p.user_id = auth.uid() 
         AND p.role IN ('coordenador', 'diretor', 'auxiliar')
       ));