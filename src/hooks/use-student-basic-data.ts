import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StudentBasicData {
  id: string;
  student_id: string;
  telefone: string | null;
  endereco: string | null;
  cep: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  estado_civil: string | null;
  religiao: string | null;
  batizado: string | null;
  pis_nis: string | null;
  cartao_sus: string | null;
  cidade_nascimento: string | null;
  estado_nascimento: string | null;
  situacao_moradia: string | null;
  escolaridade: string | null;
  estuda: boolean | null;
  nome_mae: string | null;
  data_nascimento_mae: string | null;
  data_nascimento_mae_desconhecida: boolean | null;
  estado_mae: string | null;
  nome_pai: string | null;
  data_nascimento_pai: string | null;
  data_nascimento_pai_desconhecida: boolean | null;
  estado_pai: string | null;
  nome_conjuge: string | null;
  data_nascimento_conjuge: string | null;
  data_nascimento_conjuge_desconhecida: boolean | null;
  estado_conjuge: string | null;
  ha_processos: boolean | null;
  comarca_juridica: string | null;
  observacoes_juridicas: string | null;
  created_at: string;
  updated_at: string;
}

export function useStudentBasicData(studentId?: string) {
  const [basicData, setBasicData] = useState<StudentBasicData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBasicData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_basic_data')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;
      setBasicData(data);
    } catch (err) {
      console.error('Error fetching basic data:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchBasicData();
  }, [fetchBasicData]);

  return {
    basicData,
    loading,
    fetchBasicData,
  };
}
