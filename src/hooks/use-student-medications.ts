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
  gerar_evento: boolean;
  setor_responsavel_id: string | null;
  calendar_event_id: string | null;
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
  gerar_evento: boolean;
  setor_responsavel_id?: string;
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
      // Fetch medications with tipo_uso
      const { data: medsData, error: medsError } = await supabase
        .from('student_medications')
        .select(`
          *,
          tipo_uso:medication_usage_types(id, nome, cor)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (medsError) throw medsError;

      // Fetch schedules for each medication
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
      // Create medication
      const { data: newMed, error: medError } = await supabase
        .from('student_medications')
        .insert([{
          student_id: studentId,
          created_by: user.id,
          ...data
        }])
        .select()
        .single();

      if (medError) throw medError;

      // Create schedules
      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map(s => ({
          medication_id: newMed.id,
          ...s
        }));

        const { error: schedError } = await supabase
          .from('medication_schedules')
          .insert(schedulesToInsert);

        if (schedError) throw schedError;

        // Create calendar events for schedules with gerar_evento = true
        for (const schedule of schedules) {
          if (schedule.gerar_evento && schedule.setor_responsavel_id) {
            await createCalendarEvent(newMed.id, schedule, data.nome_medicamento);
          }
        }
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
      // Update medication
      const { error: medError } = await supabase
        .from('student_medications')
        .update(data)
        .eq('id', medicationId);

      if (medError) throw medError;

      // Delete existing schedules
      const { error: delError } = await supabase
        .from('medication_schedules')
        .delete()
        .eq('medication_id', medicationId);

      if (delError) throw delError;

      // Create new schedules
      if (schedules.length > 0) {
        const schedulesToInsert = schedules.map(s => ({
          medication_id: medicationId,
          ...s
        }));

        const { error: schedError } = await supabase
          .from('medication_schedules')
          .insert(schedulesToInsert);

        if (schedError) throw schedError;

        // Create calendar events for schedules with gerar_evento = true
        for (const schedule of schedules) {
          if (schedule.gerar_evento && schedule.setor_responsavel_id) {
            await createCalendarEvent(medicationId, schedule, data.nome_medicamento);
          }
        }
      }

      await fetchMedications();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const createCalendarEvent = async (
    medicationId: string,
    schedule: ScheduleInput,
    medicationName: string
  ) => {
    if (!user || !studentId) return;

    try {
      // Get student name
      const { data: student } = await supabase
        .from('students')
        .select('nome_completo')
        .eq('id', studentId)
        .single();

      const studentName = student?.nome_completo || 'Aluno';
      
      // Parse time
      const [hours, minutes] = schedule.horario.split(':').map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(today);
      endTime.setMinutes(endTime.getMinutes() + 15);

      // Create calendar event
      const { data: event, error } = await supabase
        .from('calendar_events')
        .insert([{
          titulo: `💊 Medicação: ${medicationName} - ${studentName}`,
          descricao: `Administrar medicamento: ${medicationName}\nHorário: ${schedule.horario}\nInstruções: ${schedule.instrucoes || 'Nenhuma'}`,
          tipo: 'lembrete',
          data_inicio: today.toISOString(),
          data_fim: endTime.toISOString(),
          created_by: user.id,
          recurrence_type: schedule.frequencia === 'diaria' ? 'daily' : 'weekly'
        }])
        .select()
        .single();

      if (error) throw error;

      // Link event to schedule
      if (event) {
        await supabase
          .from('medication_schedules')
          .update({ calendar_event_id: event.id })
          .eq('medication_id', medicationId)
          .eq('horario', schedule.horario);

        // Add sector users as participants
        if (schedule.setor_responsavel_id) {
          const { data: sectorUsers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('setor_id', schedule.setor_responsavel_id)
            .eq('active', true);

          if (sectorUsers && sectorUsers.length > 0) {
            const participants = sectorUsers.map(u => ({
              event_id: event.id,
              user_id: u.user_id,
              is_organizer: false,
              status: 'pendente' as const
            }));

            await supabase.from('event_participants').insert(participants);
          }
        }
      }
    } catch (err) {
      console.error('Error creating calendar event:', err);
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
