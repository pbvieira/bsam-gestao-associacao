import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentWorkSituation {
  id: string;
  student_id: string;
  situacao_trabalhista: string | null;
  profissao: string | null;
  empresa: string | null;
  funcao: string | null;
  data_admissao: string | null;
  contato_empresa: string | null;
  tipo_renda: string | null;
  valor_renda: number | null;
  renda_per_capita: number | null;
  created_at: string;
  updated_at: string;
}

export function useStudentWorkSituation(studentId?: string) {
  const { user } = useAuth();
  const [workSituation, setWorkSituation] = useState<StudentWorkSituation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkSituation = async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('student_work_situation')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      setWorkSituation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkSituation();
  }, [user, studentId]);

  const createOrUpdateWorkSituation = async (data: Partial<StudentWorkSituation>) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const workData = {
        student_id: studentId,
        ...data,
        // Converter string vazia para null em campos de data
        data_admissao: data.data_admissao === '' ? null : data.data_admissao,
      };

      let result;
      if (workSituation?.id) {
        // Update existing
        result = await supabase
          .from('student_work_situation')
          .update(workData)
          .eq('id', workSituation.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('student_work_situation')
          .insert([workData])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      await fetchWorkSituation();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return {
    workSituation,
    loading,
    error,
    fetchWorkSituation,
    createOrUpdateWorkSituation
  };
}