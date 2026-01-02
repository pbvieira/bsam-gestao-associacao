import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentBenefit {
  id: string;
  student_id: string;
  tipo_beneficio: string;
  descricao: string | null;
  valor: number;
  created_at: string;
}

export function useStudentBenefits(studentId?: string) {
  const { user } = useAuth();
  const [benefitsList, setBenefitsList] = useState<StudentBenefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenefitsList = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_benefits_list')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBenefitsList(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    fetchBenefitsList();
  }, [fetchBenefitsList]);

  const addBenefit = async (data: { tipo_beneficio: string; descricao?: string; valor: number }) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const { data: result, error } = await supabase
        .from('student_benefits_list')
        .insert([{
          student_id: studentId,
          tipo_beneficio: data.tipo_beneficio,
          descricao: data.descricao || null,
          valor: data.valor,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchBenefitsList();
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateBenefit = async (id: string, data: { tipo_beneficio?: string; descricao?: string; valor?: number }) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data: result, error } = await supabase
        .from('student_benefits_list')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchBenefitsList();
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteBenefit = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_benefits_list')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBenefitsList();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const totalBenefits = benefitsList.reduce((sum, item) => sum + (item.valor || 0), 0);

  return {
    benefitsList,
    loading,
    error,
    totalBenefits,
    fetchBenefitsList,
    addBenefit,
    updateBenefit,
    deleteBenefit,
  };
}
