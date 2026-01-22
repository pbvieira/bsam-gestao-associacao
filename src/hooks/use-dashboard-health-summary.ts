import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type TimeFilter = 'day' | 'week' | 'month';

export interface HealthSummary {
  medications: {
    total: number;
    administrados: number;
    pendentes: number;
    naoAdministrados: number;
  };
  appointments: {
    total: number;
    realizados: number;
    pendentes: number;
    naoRealizados: number;
  };
  isLoading: boolean;
}

const dayNumberToName: Record<number, string> = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

const getDateRange = (date: Date, period: TimeFilter) => {
  switch (period) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) };
    case 'week':
      return { 
        start: startOfWeek(date, { locale: ptBR }), 
        end: endOfWeek(date, { locale: ptBR }) 
      };
    case 'month':
      return { 
        start: startOfMonth(date), 
        end: endOfMonth(date) 
      };
  }
};

export function useDashboardHealthSummary(timeFilter: TimeFilter = 'day') {
  const today = new Date();
  const { start, end } = getDateRange(today, timeFilter);

  const { data: medicationStats, isLoading: isMedicationsLoading } = useQuery({
    queryKey: ['dashboard-medication-stats', timeFilter, start.toISOString()],
    queryFn: async () => {
      // 1. Get active medication schedules
      const { data: schedules, error } = await supabase
        .from('medication_schedules')
        .select(`
          id,
          horario,
          frequencia,
          dias_semana,
          ativo,
          medication:student_medications!medication_id (
            id,
            ativo,
            data_inicio,
            data_fim
          )
        `)
        .eq('ativo', true);

      if (error) throw error;

      // Filter active medications
      const activeSchedules = (schedules || []).filter(s => 
        s.medication && s.medication.ativo === true
      );

      if (activeSchedules.length === 0) {
        return { total: 0, administrados: 0, pendentes: 0, naoAdministrados: 0 };
      }

      // 2. Get logs for the period
      const { data: logs, error: logsError } = await supabase
        .from('medication_administration_log')
        .select('schedule_id, data_agendada, administrado, nao_administrado_motivo')
        .gte('data_agendada', start.toISOString())
        .lte('data_agendada', end.toISOString());

      if (logsError) throw logsError;

      // Create a map of logs by schedule_id + date
      const logsMap = new Map<string, typeof logs[0]>();
      (logs || []).forEach(log => {
        const dateKey = format(new Date(log.data_agendada), 'yyyy-MM-dd');
        const key = `${log.schedule_id}_${dateKey}`;
        logsMap.set(key, log);
      });

      // 3. Calculate totals by processing each day in the period
      const daysInPeriod = eachDayOfInterval({ start, end });
      let total = 0;
      let administrados = 0;
      let pendentes = 0;
      let naoAdministrados = 0;

      for (const day of daysInPeriod) {
        const dayOfWeek = getDay(day);
        const dayName = dayNumberToName[dayOfWeek];
        const dateKey = format(day, 'yyyy-MM-dd');

        for (const schedule of activeSchedules) {
          const medication = schedule.medication;
          if (!medication) continue;

          // Check if medication is active for this day
          const dataInicio = medication.data_inicio ? parseISO(medication.data_inicio) : null;
          const dataFim = medication.data_fim ? parseISO(medication.data_fim) : null;

          if (dataInicio && day < startOfDay(dataInicio)) continue;
          if (dataFim && day > endOfDay(dataFim)) continue;

          // Check frequency
          const freq = schedule.frequencia || 'diario';
          const diasSemana = schedule.dias_semana || [];

          let appliesThisDay = false;
          if (freq === 'diario') {
            appliesThisDay = true;
          } else if (freq === 'dias_especificos' && diasSemana.includes(dayName)) {
            appliesThisDay = true;
          }

          if (!appliesThisDay) continue;

          // Count this schedule for this day
          total++;

          // Check if there's a log
          const logKey = `${schedule.id}_${dateKey}`;
          const log = logsMap.get(logKey);

          if (log) {
            if (log.administrado === true) {
              administrados++;
            } else if (log.nao_administrado_motivo) {
              naoAdministrados++;
            } else {
              pendentes++;
            }
          } else {
            pendentes++;
          }
        }
      }

      return { total, administrados, pendentes, naoAdministrados };
    },
  });

  const { data: appointmentStats, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['dashboard-appointment-stats', timeFilter, start.toISOString()],
    queryFn: async () => {
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      // Get medical records with dates in the period
      const { data: records, error } = await supabase
        .from('student_medical_records')
        .select('id, data_atendimento, data_retorno');

      if (error) throw error;

      if (!records || records.length === 0) {
        return { total: 0, realizados: 0, pendentes: 0, naoRealizados: 0 };
      }

      // Filter records that have appointments in the period
      const periodStart = start;
      const periodEnd = end;
      
      const appointmentsInPeriod: Array<{ recordId: string; date: string; type: 'atendimento' | 'retorno' }> = [];
      
      for (const record of records) {
        if (record.data_atendimento) {
          const atendDate = parseISO(record.data_atendimento);
          if (isWithinInterval(atendDate, { start: periodStart, end: periodEnd })) {
            appointmentsInPeriod.push({ 
              recordId: record.id, 
              date: record.data_atendimento, 
              type: 'atendimento' 
            });
          }
        }
        if (record.data_retorno) {
          const retornoDate = parseISO(record.data_retorno);
          if (isWithinInterval(retornoDate, { start: periodStart, end: periodEnd })) {
            appointmentsInPeriod.push({ 
              recordId: record.id, 
              date: record.data_retorno, 
              type: 'retorno' 
            });
          }
        }
      }

      if (appointmentsInPeriod.length === 0) {
        return { total: 0, realizados: 0, pendentes: 0, naoRealizados: 0 };
      }

      const recordIds = [...new Set(appointmentsInPeriod.map(a => a.recordId))];

      // Get logs for these records
      const { data: logs, error: logsError } = await supabase
        .from('medical_appointment_log')
        .select('medical_record_id, data_agendada, realizado, nao_realizado_motivo')
        .in('medical_record_id', recordIds);

      if (logsError) throw logsError;

      // Create a map of logs by record_id + date
      const logsMap = new Map<string, typeof logs[0]>();
      (logs || []).forEach(log => {
        const dateKey = format(new Date(log.data_agendada), 'yyyy-MM-dd');
        const key = `${log.medical_record_id}_${dateKey}`;
        logsMap.set(key, log);
      });

      // Count stats
      let total = appointmentsInPeriod.length;
      let realizados = 0;
      let pendentes = 0;
      let naoRealizados = 0;

      for (const apt of appointmentsInPeriod) {
        const dateKey = format(parseISO(apt.date), 'yyyy-MM-dd');
        const logKey = `${apt.recordId}_${dateKey}`;
        const log = logsMap.get(logKey);

        if (log) {
          if (log.realizado === true) {
            realizados++;
          } else if (log.nao_realizado_motivo) {
            naoRealizados++;
          } else {
            pendentes++;
          }
        } else {
          pendentes++;
        }
      }

      return { total, realizados, pendentes, naoRealizados };
    },
  });

  return {
    medications: medicationStats || { total: 0, administrados: 0, pendentes: 0, naoAdministrados: 0 },
    appointments: appointmentStats || { total: 0, realizados: 0, pendentes: 0, naoRealizados: 0 },
    isLoading: isMedicationsLoading || isAppointmentsLoading
  };
}
