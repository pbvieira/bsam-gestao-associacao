import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export function useStudentPhoto(studentId?: string | null) {
  const { user } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPhoto = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      setPhotoUrl(null);
      return;
    }
    
    setLoading(true);
    try {
      // Buscar o documento mais recente do tipo 'foto_aluno'
      const { data: document, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .eq('tipo_documento', 'foto_aluno')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!document) {
        setPhotoUrl(null);
        setLoading(false);
        return;
      }

      // Criar URL assinada para a foto
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('student-documents')
        .createSignedUrl(document.caminho_arquivo, 3600); // 1 hora

      if (urlError) throw urlError;
      
      setPhotoUrl(signedUrlData.signedUrl);
    } catch (err: any) {
      console.error('Erro ao buscar foto do aluno:', err.message);
      setPhotoUrl(null);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    fetchPhoto();
  }, [fetchPhoto]);

  return {
    photoUrl,
    loading,
    refreshPhoto: fetchPhoto
  };
}
