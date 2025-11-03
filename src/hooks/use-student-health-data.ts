import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface StudentHealthData {
  id: string;
  student_id: string;
  // Testes médicos
  teste_covid: string | null;
  resultado_covid: string | null;
  data_teste_covid: string | null;
  teste_ist: string | null;
  resultado_ist: string | null;
  data_teste_ist: string | null;
  // Deficiência e tratamentos
  tem_deficiencia: boolean;
  tipo_deficiencia: string | null;
  vacinacao_atualizada: boolean;
  tratamento_odontologico: boolean;
  observacoes_odontologicas: string | null;
  // Saúde mental
  historico_internacoes: string | null;
  acompanhamento_psicologico: boolean;
  detalhes_acompanhamento: string | null;
  tentativa_suicidio: boolean;
  historico_surtos: boolean;
  alucinacoes: boolean;
  // Medicamentos
  uso_medicamentos: boolean;
  descricao_medicamentos: string | null;
  tempo_uso_medicamentos: string | null;
  modo_uso_medicamentos: string | null;
  // Histórico familiar
  dependencia_quimica_familia: boolean;
  detalhes_dependencia_familia: string | null;
  observacoes_gerais: string | null;
  created_at: string;
  updated_at: string;
}

export function useStudentHealthData(studentId?: string) {
  const { user } = useAuth();
  const [healthData, setHealthData] = useState<StudentHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('student_health_data')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      setHealthData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, [user, studentId]);

  const createOrUpdateHealthData = async (data: Partial<StudentHealthData>) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      // Convert empty strings to null for date fields
      const healthDataInput = {
        student_id: studentId,
        ...data,
        data_teste_covid: data.data_teste_covid === '' ? null : data.data_teste_covid,
        data_teste_ist: data.data_teste_ist === '' ? null : data.data_teste_ist,
      };

      let result;
      if (healthData?.id) {
        // Update existing
        result = await supabase
          .from('student_health_data')
          .update(healthDataInput)
          .eq('id', healthData.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('student_health_data')
          .insert([healthDataInput])
          .select()
          .single();
      }

      if (result.error) throw result.error;
      await fetchHealthData();
      return { data: result.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  return {
    healthData,
    loading,
    error,
    fetchHealthData,
    createOrUpdateHealthData
  };
}