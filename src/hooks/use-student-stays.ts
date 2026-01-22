import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentStay {
  id: string;
  student_id: string;
  data_entrada: string;
  hora_entrada: string | null;
  data_saida: string;
  hora_saida: string | null;
  motivo_saida: string | null;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const MOTIVOS_SAIDA = [
  { value: 'alta_voluntaria', label: 'Alta Voluntária' },
  { value: 'alta_terapeutica', label: 'Alta Terapêutica' },
  { value: 'abandono', label: 'Abandono' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'internacao_hospitalar', label: 'Internação Hospitalar' },
  { value: 'desligamento', label: 'Desligamento' },
  { value: 'obito', label: 'Óbito' },
  { value: 'outro', label: 'Outro' },
] as const;

export function useStudentStays(studentId: string | null) {
  const { user } = useAuth();
  const [stays, setStays] = useState<StudentStay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStays = async () => {
    if (!studentId || !user) {
      setStays([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_stays')
        .select('*')
        .eq('student_id', studentId)
        .order('data_entrada', { ascending: false });

      if (error) throw error;
      setStays(data || []);
    } catch (err: any) {
      setError(err.message);
      setStays([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStays();
  }, [studentId, user]);

  const createStay = async (stayData: {
    student_id: string;
    data_entrada: string;
    hora_entrada?: string | null;
    data_saida: string;
    hora_saida?: string | null;
    motivo_saida?: string | null;
    observacoes?: string | null;
  }) => {
    if (!user) return { data: null, error: 'Usuário não autenticado' };

    try {
      const { data, error } = await supabase
        .from('student_stays')
        .insert([{
          ...stayData,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchStays();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateStay = async (id: string, stayData: Partial<StudentStay>) => {
    try {
      const { data, error } = await supabase
        .from('student_stays')
        .update(stayData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchStays();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteStay = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_stays')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStays();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const getMotivoLabel = (value: string | null): string => {
    if (!value) return '-';
    const motivo = MOTIVOS_SAIDA.find(m => m.value === value);
    return motivo?.label || value;
  };

  return {
    stays,
    loading,
    error,
    fetchStays,
    createStay,
    updateStay,
    deleteStay,
    getMotivoLabel,
  };
}
