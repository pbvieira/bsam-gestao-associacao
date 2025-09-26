import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentDocument {
  id: string;
  student_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  caminho_arquivo: string;
  tamanho_arquivo: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export function useStudentDocuments(studentId?: string) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!user || !studentId) return;
    
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user, studentId]);

  const uploadDocument = async (file: File, tipo_documento: string, nome_arquivo?: string) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const fileName = nome_arquivo || file.name;
      const filePath = `${studentId}/${Date.now()}-${fileName}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error: dbError } = await supabase
        .from('student_documents')
        .insert([{
          student_id: studentId,
          tipo_documento,
          nome_arquivo: fileName,
          caminho_arquivo: filePath,
          tamanho_arquivo: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        }])
        .select()
        .single();

      if (dbError) throw dbError;
      await fetchDocuments();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const downloadDocument = async (document: StudentDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-documents')
        .download(document.caminho_arquivo);

      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.nome_arquivo;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const deleteDocument = async (document: StudentDocument) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('student-documents')
        .remove([document.caminho_arquivo]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
      await fetchDocuments();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const getDocumentUrl = async (document: StudentDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-documents')
        .createSignedUrl(document.caminho_arquivo, 3600); // 1 hour expiry

      if (error) throw error;
      return { url: data.signedUrl, error: null };
    } catch (err: any) {
      return { url: null, error: err.message };
    }
  };

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getDocumentUrl
  };
}