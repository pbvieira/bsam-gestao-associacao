import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentAnnotation {
  id: string;
  student_id: string;
  tipo: string;
  categoria: string | null;
  descricao: string;
  data_evento: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnotationsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  categoria?: string;
  dateFrom?: string;
  dateTo?: string;
  sortDir?: 'asc' | 'desc';
  all?: boolean;
}

export function useStudentAnnotations(studentId?: string, filters: AnnotationsFilters = {}) {
  const { user } = useAuth();
  const [annotations, setAnnotations] = useState<StudentAnnotation[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    page = 1,
    pageSize = 10,
    search = '',
    categoria = '',
    dateFrom = '',
    dateTo = '',
    sortDir = 'desc',
    all = false,
  } = filters;

  const fetchAnnotations = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('student_annotations')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId);

      if (categoria) query = query.eq('categoria', categoria);
      if (dateFrom) query = query.gte('data_evento', dateFrom);
      if (dateTo) query = query.lte('data_evento', dateTo);
      if (search.trim()) {
        const s = search.trim().replace(/[%,]/g, '');
        query = query.or(`descricao.ilike.%${s}%,categoria.ilike.%${s}%`);
      }

      query = query.order('data_evento', { ascending: sortDir === 'asc' });
      if (!all) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setAnnotations(data || []);
      setTotal(count || 0);

      const { count: countAll } = await supabase
        .from('student_annotations')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId);
      setTotalAll(countAll || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, studentId, page, pageSize, search, categoria, dateFrom, dateTo, sortDir, all]);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

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
    total,
    totalAll,
    loading,
    error,
    fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation
  };
}
