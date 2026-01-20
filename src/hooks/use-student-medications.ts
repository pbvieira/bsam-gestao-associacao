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

// Helper function to generate all event dates based on frequency
const generateEventDates = (
  startDate: string,
  endDate: string | null | undefined,
  frequencia: string,
  diasSemana?: string[]
): Date[] => {
  const dates: Date[] = [];
  const start = new Date(startDate + 'T00:00:00');
  
  // For continuous use without end date, generate events for the next 30 days
  const maxDate = endDate 
    ? new Date(endDate + 'T23:59:59') 
    : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  let current = new Date(start);
  const dayNames = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  
  while (current <= maxDate) {
    const dayOfWeek = dayNames[current.getDay()];
    
    if (frequencia === 'diaria') {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    } else if (frequencia === 'dias_alternados') {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 2); // Skip one day (every other day)
    } else if (frequencia === 'semanal') {
      if (diasSemana && diasSemana.length > 0 && diasSemana.includes(dayOfWeek)) {
        dates.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    } else {
      // Default: add the date and move to next day
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }
  
  return dates;
};

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

  const createCalendarEvents = async (
    medicationId: string,
    schedule: ScheduleInput,
    medicationName: string,
    dataInicio: string | undefined,
    dataFim: string | null | undefined
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
      const [hours, minutes] = schedule.horario.split(':').map(Number);
      
      // Use medication start date or today as fallback
      const startDateStr = dataInicio || new Date().toISOString().split('T')[0];
      
      // Generate all dates based on frequency
      const eventDates = generateEventDates(
        startDateStr,
        dataFim,
        schedule.frequencia,
        schedule.dias_semana
      );

      console.log(`📅 Gerando ${eventDates.length} eventos para medicação ${medicationName}`);

      if (eventDates.length === 0) {
        console.log('⚠️ Nenhuma data gerada para eventos');
        return;
      }

      // Create events in batch
      const eventsToCreate = eventDates.map(date => {
        const eventStart = new Date(date);
        eventStart.setHours(hours, minutes, 0, 0);
        
        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + 15);
        
        return {
          titulo: `💊 Medicação: ${medicationName} - ${studentName}`,
          descricao: `Administrar medicamento: ${medicationName}\nHorário: ${schedule.horario}\nInstruções: ${schedule.instrucoes || 'Nenhuma'}`,
          tipo: 'lembrete' as const,
          data_inicio: eventStart.toISOString(),
          data_fim: eventEnd.toISOString(),
          created_by: user.id,
          recurrence_type: 'none' as const // Each event is unique
        };
      });

      // Insert all events
      const { data: events, error } = await supabase
        .from('calendar_events')
        .insert(eventsToCreate)
        .select();

      if (error) throw error;

      // Link first event to schedule
      if (events && events.length > 0) {
        await supabase
          .from('medication_schedules')
          .update({ calendar_event_id: events[0].id })
          .eq('medication_id', medicationId)
          .eq('horario', schedule.horario);

        // Add sector users as participants to all events
        if (schedule.setor_responsavel_id) {
          const { data: sectorUsers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('setor_id', schedule.setor_responsavel_id)
            .eq('active', true);

          if (sectorUsers && sectorUsers.length > 0) {
            const allParticipants = events.flatMap(event => 
              sectorUsers.map(u => ({
                event_id: event.id,
                user_id: u.user_id,
                is_organizer: false,
                status: 'pendente' as const
              }))
            );

            await supabase.from('event_participants').insert(allParticipants);
          }
        }
      }

      console.log(`✅ ${events?.length || 0} eventos criados com sucesso`);
    } catch (err) {
      console.error('Error creating calendar events:', err);
    }
  };

  const deleteOldCalendarEvents = async (medicationId: string) => {
    try {
      // Get old schedules with calendar event IDs
      const { data: oldSchedules } = await supabase
        .from('medication_schedules')
        .select('calendar_event_id')
        .eq('medication_id', medicationId);

      if (oldSchedules) {
        const eventIds = oldSchedules
          .map(s => s.calendar_event_id)
          .filter((id): id is string => id !== null);
        
        if (eventIds.length > 0) {
          // Get medication name to find related events
          const { data: medication } = await supabase
            .from('student_medications')
            .select('nome_medicamento')
            .eq('id', medicationId)
            .single();

          if (medication) {
            // Get student name
            const { data: student } = await supabase
              .from('students')
              .select('nome_completo')
              .eq('id', studentId)
              .single();

            const studentName = student?.nome_completo || '';
            const eventTitle = `💊 Medicação: ${medication.nome_medicamento} - ${studentName}`;

            // Delete all events with this title pattern
            const { error } = await supabase
              .from('calendar_events')
              .delete()
              .ilike('titulo', `%${medication.nome_medicamento}%`)
              .eq('created_by', user?.id || '');

            if (error) {
              console.error('Error deleting old calendar events:', error);
            } else {
              console.log(`🗑️ Eventos antigos deletados para medicação ${medication.nome_medicamento}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up old calendar events:', err);
    }
  };

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
            await createCalendarEvents(
              newMed.id, 
              schedule, 
              data.nome_medicamento,
              data.data_inicio,
              data.data_fim
            );
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
      // Delete old calendar events before updating
      await deleteOldCalendarEvents(medicationId);

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
            await createCalendarEvents(
              medicationId, 
              schedule, 
              data.nome_medicamento,
              data.data_inicio,
              data.data_fim
            );
          }
        }
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
      // Delete calendar events first
      await deleteOldCalendarEvents(medicationId);

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
