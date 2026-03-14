import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface MedicationSchedule {
  id: string;
  medication_id: string;
  horario: string;
  frequencia: string;
  dias_semana: string[] | null;
  instrucoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentMedication {
  id: string;
  student_id: string;
  nome_medicamento: string;
  principio_ativo: string | null;
  dosagem: string | null;
  forma_farmaceutica: string | null;
  tipo_uso_id: string | null;
  prescrito_por: string | null;
  farmacia: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  ativo: boolean;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  schedules?: MedicationSchedule[];
  tipo_uso?: {
    id: string;
    nome: string;
    cor: string;
  } | null;
}

export interface MedicationInput {
  nome_medicamento: string;
  principio_ativo?: string;
  dosagem?: string;
  forma_farmaceutica?: string;
  tipo_uso_id?: string;
  prescrito_por?: string;
  farmacia?: string;
  data_inicio?: string;
  data_fim?: string;
  observacoes?: string;
  ativo?: boolean;
}

export interface ScheduleInput {
  horario: string;
  frequencia: string;
  dias_semana?: string[];
  instrucoes?: string;
}

export function useStudentMedications(studentId?: string) {
  const { user } = useAuth();
  const [medications, setMedications] = useState<StudentMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }

    try {
      const { data: medsData, error: medsError } = await supabase
        .from('student_medications')
        .select(`
          *,
          tipo_uso:medication_usage_types(id, nome, cor)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (medsError) throw medsError;

      const medicationsWithSchedules = await Promise.all(
        (medsData || []).map(async (med) => {
          const { data: schedules } = await supabase
            .from('medication_schedules')
            .select('*')
            .eq('medication_id', med.id)
            .order('horario', { ascending: true });

          return {
            ...med,
            schedules: schedules || []
          };
        })
      );

      setMedications(medicationsWithSchedules);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, [user, studentId]);

  const createMedication = async (
    data: MedicationInput,
    schedules: ScheduleInput[]
  ) => {
    if (!user || !studentId) return { error: 'Dados insuficientes' };

    try {
      const sanitizedData = {
        ...data,
        tipo_uso_id: data.tipo_uso_id || null,
        farmacia: data.farmacia || null,
        data_inicio: data.data_inicio || null,
        data_fim: data.data_fim || null,
      };

      const { data: newMed, error: medError } = await supabase
        .from('student_medications')
        .insert([{
          student_id: studentId,
          created_by: user.id,
          ...sanitizedData
        }])
        .select()
        .single();

      if (medError) throw medError;

      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map(s => ({
          medication_id: newMed.id,
          horario: s.horario,
          frequencia: s.frequencia,
          dias_semana: s.dias_semana?.length ? s.dias_semana : null,
          instrucoes: s.instrucoes || null,
          gerar_evento: false,
        }));

        const { error: schedError } = await supabase
          .from('medication_schedules')
          .insert(schedulesToInsert);

        if (schedError) throw schedError;
      }

      await fetchMedications();
      return { data: newMed, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateMedication = async (
    medicationId: string,
    data: MedicationInput,
    schedules: ScheduleInput[]
  ) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const sanitizedData = {
        ...data,
        tipo_uso_id: data.tipo_uso_id || null,
        farmacia: data.farmacia || null,
        data_inicio: data.data_inicio || null,
        data_fim: data.data_fim || null,
      };

      const { error: medError } = await supabase
        .from('student_medications')
        .update(sanitizedData)
        .eq('id', medicationId);

      if (medError) throw medError;

      const { error: delError } = await supabase
        .from('medication_schedules')
        .delete()
        .eq('medication_id', medicationId);

      if (delError) throw delError;

      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map(s => ({
          medication_id: medicationId,
          horario: s.horario,
          frequencia: s.frequencia,
          dias_semana: s.dias_semana?.length ? s.dias_semana : null,
          instrucoes: s.instrucoes || null,
          gerar_evento: false,
        }));

        const { error: schedError } = await supabase
          .from('medication_schedules')
          .insert(schedulesToInsert);

        if (schedError) throw schedError;
      }

      await fetchMedications();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const deleteMedication = async (medicationId: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_medications')
        .delete()
        .eq('id', medicationId);

      if (error) throw error;
      await fetchMedications();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const toggleMedicationStatus = async (medicationId: string, ativo: boolean) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_medications')
        .update({ ativo })
        .eq('id', medicationId);

      if (error) throw error;
      await fetchMedications();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    medications,
    loading,
    error,
    fetchMedications,
    createMedication,
    updateMedication,
    deleteMedication,
    toggleMedicationStatus
  };
}
