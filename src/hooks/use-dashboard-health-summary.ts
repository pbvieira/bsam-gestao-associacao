import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
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
      // Get all medication schedules that should occur in the period
      const { data: schedules, error } = await supabase
        .from('medication_schedules')
        .select(`
          id,
          horario,
          frequencia,
          dias_semana,
          student_medication:student_medication_id (
            id,
            ativo,
            data_inicio,
            data_fim
          )
        `);

      if (error) throw error;

      // Get administration logs for the period
      const { data: logs, error: logsError } = await supabase
        .from('medication_administration_log')
        .select('*')
        .gte('data_agendada', start.toISOString())
        .lte('data_agendada', end.toISOString());

      if (logsError) throw logsError;

      // Count stats from logs
      // Uses 'administrado' boolean and 'nao_administrado_motivo' for status
      const total = logs?.length || 0;
      const administrados = logs?.filter(l => l.administrado === true).length || 0;
      const naoAdministrados = logs?.filter(l => l.administrado === false && l.nao_administrado_motivo).length || 0;
      const pendentes = logs?.filter(l => l.administrado === false && !l.nao_administrado_motivo).length || 0;

      return {
        total,
        administrados,
        pendentes,
        naoAdministrados
      };
    },
  });

  const { data: appointmentStats, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['dashboard-appointment-stats', timeFilter, start.toISOString()],
    queryFn: async () => {
      const startStr = start.toISOString();
      const endStr = end.toISOString();

      // Get medical records in the period
      const { data: records, error } = await supabase
        .from('student_medical_records')
        .select('id, data_atendimento, data_retorno')
        .or(`and(data_atendimento.gte.${startStr},data_atendimento.lte.${endStr}),and(data_retorno.gte.${startStr},data_retorno.lte.${endStr})`);

      if (error) throw error;

      if (!records || records.length === 0) {
        return { total: 0, realizados: 0, pendentes: 0, naoRealizados: 0 };
      }

      const recordIds = records.map(r => r.id);

      // Get appointment logs for these records
      const { data: logs, error: logsError } = await supabase
        .from('medical_appointment_log')
        .select('medical_record_id, realizado, nao_realizado_motivo')
        .in('medical_record_id', recordIds)
        .gte('data_agendada', startStr)
        .lte('data_agendada', endStr);

      if (logsError) throw logsError;

      // Count stats
      const total = logs?.length || 0;
      const realizados = logs?.filter(l => l.realizado === true).length || 0;
      const naoRealizados = logs?.filter(l => l.realizado === false && l.nao_realizado_motivo).length || 0;
      const pendentes = logs?.filter(l => l.realizado === false && !l.nao_realizado_motivo).length || 0;

      return {
        total,
        realizados,
        pendentes,
        naoRealizados
      };
    },
  });

  return {
    medications: medicationStats || { total: 0, administrados: 0, pendentes: 0, naoAdministrados: 0 },
    appointments: appointmentStats || { total: 0, realizados: 0, pendentes: 0, naoRealizados: 0 },
    isLoading: isMedicationsLoading || isAppointmentsLoading
  };
}
