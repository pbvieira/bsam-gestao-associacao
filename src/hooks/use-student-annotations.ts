import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentAnnotation {
  id: string;
  student_id: string;
  tipo: string; // apenas 'anotacao'
  categoria: string | null; // Nome da categoria
  descricao: string;
  data_evento: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useStudentAnnotations(studentId?: string) {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<StudentAnnotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnotations = async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('student_annotations')
        .select('*')
        .eq('student_id', studentId)
        .order('data_evento', { ascending: false });

      if (error) throw error;
      setAnnotations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnotations();
  }, [user, studentId]);

  const createAnnotation = async (annotationData: Omit<StudentAnnotation, 'id' | 'student_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const { data, error } = await supabase
        .from('student_annotations')
        .insert([{ 
          ...annotationData, 
          student_id: studentId,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchAnnotations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateAnnotation = async (id: string, annotationData: Partial<StudentAnnotation>) => {
    try {
      const { data, error } = await supabase
        .from('student_annotations')
        .update(annotationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchAnnotations();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteAnnotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_annotations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAnnotations();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    annotations,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  };
}