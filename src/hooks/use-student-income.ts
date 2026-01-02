import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentIncome {
  id: string;
  student_id: string;
  tipo_renda: string;
  descricao: string | null;
  valor: number;
  created_at: string;
}

export function useStudentIncome(studentId?: string) {
  const { user } = useAuth();
  const [incomeList, setIncomeList] = useState<StudentIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncomeList = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_income_list')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setIncomeList(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    fetchIncomeList();
  }, [fetchIncomeList]);

  const addIncome = async (data: { tipo_renda: string; descricao?: string; valor: number }) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const { data: result, error } = await supabase
        .from('student_income_list')
        .insert([{
          student_id: studentId,
          tipo_renda: data.tipo_renda,
          descricao: data.descricao || null,
          valor: data.valor,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchIncomeList();
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateIncome = async (id: string, data: { tipo_renda?: string; descricao?: string; valor?: number }) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data: result, error } = await supabase
        .from('student_income_list')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchIncomeList();
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteIncome = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_income_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchIncomeList();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const totalIncome = incomeList.reduce((sum, item) => sum + (item.valor || 0), 0);

  return {
    incomeList,
    loading,
    error,
    totalIncome,
    fetchIncomeList,
    addIncome,
    updateIncome,
    deleteIncome,
  };
}
