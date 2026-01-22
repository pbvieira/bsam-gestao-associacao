import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { format } from 'date-fns';

export interface MedicalAppointment {
  id: string;
  medical_record_id: string;
  student_id: string;
  student_name: string;
  student_codigo: string;
  tipo: 'atendimento' | 'retorno';
  tipo_atendimento: string;
  especialidade: string | null;
  profissional: string | null;
  local: string | null;
  motivo: string | null;
  data_agendada: string;
  
  // Log status
  log_id?: string;
  realizado: boolean;
  data_realizacao?: string;
  realizado_por?: string;
  realizado_por_nome?: string;
  observacoes?: string;
  nao_realizado_motivo?: string;
}

export interface GroupedAppointments {
  grupo: string;
  icon: string;
  items: MedicalAppointment[];
  total: number;
  realizados: number;
}

const APPOINTMENT_GROUPS: Record<string, { label: string; icon: string }> = {
  'consulta_medica': { label: 'Consultas Médicas', icon: 'Stethoscope' },
  'consulta_odontologica': { label: 'Consultas Odontológicas', icon: 'Smile' },
  'consulta_psicologica': { label: 'Consultas Psicológicas', icon: 'Brain' },
  'exame_laboratorial': { label: 'Exames Laboratoriais', icon: 'TestTube' },
  'exame_imagem': { label: 'Exames de Imagem', icon: 'Scan' },
  'procedimento': { label: 'Procedimentos', icon: 'Syringe' },
  'urgencia': { label: 'Urgência/Emergência', icon: 'Ambulance' },
  'outro': { label: 'Outros', icon: 'FileText' },
  'retorno': { label: 'Retornos', icon: 'RotateCcw' },
};

export function useMedicalAppointments(selectedDate: Date) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<MedicalAppointment[]>([]);
  const [groupedAppointments, setGroupedAppointments] = useState<GroupedAppointments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Fetch medical records with data_atendimento or data_retorno matching the selected date
      const { data: records, error: recordsError } = await supabase
        .from('student_medical_records')
        .select(`
          id,
          student_id,
          data_atendimento,
          tipo_atendimento,
          especialidade,
          profissional,
          local,
          motivo,
          data_retorno,
          students!inner(nome_completo, codigo_cadastro)
        `)
        .or(`data_atendimento.eq.${dateStr},data_retorno.eq.${dateStr}`)
        .order('data_atendimento', { ascending: true });

      if (recordsError) throw recordsError;

      // Fetch logs for these records
      const recordIds = records?.map(r => r.id) || [];
      let logsMap: Record<string, any> = {};

      if (recordIds.length > 0) {
        const { data: logs, error: logsError } = await supabase
          .from('medical_appointment_log')
          .select('*, profiles:realizado_por(full_name)')
          .in('medical_record_id', recordIds)
          .eq('data_agendada', dateStr);

        if (logsError) throw logsError;

        logs?.forEach(log => {
          const key = `${log.medical_record_id}-${log.tipo}`;
          logsMap[key] = log;
        });
      }

      // Transform records into appointments
      const allAppointments: MedicalAppointment[] = [];

      records?.forEach(record => {
        const student = record.students as any;

        // Add appointment for data_atendimento
        if (record.data_atendimento === dateStr) {
          const logKey = `${record.id}-atendimento`;
          const log = logsMap[logKey];

          allAppointments.push({
            id: `${record.id}-atendimento`,
            medical_record_id: record.id,
            student_id: record.student_id,
            student_name: student?.nome_completo || 'Aluno',
            student_codigo: student?.codigo_cadastro || '',
            tipo: 'atendimento',
            tipo_atendimento: record.tipo_atendimento,
            especialidade: record.especialidade,
            profissional: record.profissional,
            local: record.local,
            motivo: record.motivo,
            data_agendada: dateStr,
            log_id: log?.id,
            realizado: log?.realizado || false,
            data_realizacao: log?.data_realizacao,
            realizado_por: log?.realizado_por,
            realizado_por_nome: log?.profiles?.full_name,
            observacoes: log?.observacoes,
            nao_realizado_motivo: log?.nao_realizado_motivo,
          });
        }

        // Add appointment for data_retorno
        if (record.data_retorno === dateStr) {
          const logKey = `${record.id}-retorno`;
          const log = logsMap[logKey];

          allAppointments.push({
            id: `${record.id}-retorno`,
            medical_record_id: record.id,
            student_id: record.student_id,
            student_name: student?.nome_completo || 'Aluno',
            student_codigo: student?.codigo_cadastro || '',
            tipo: 'retorno',
            tipo_atendimento: record.tipo_atendimento,
            especialidade: record.especialidade,
            profissional: record.profissional,
            local: record.local,
            motivo: record.motivo,
            data_agendada: dateStr,
            log_id: log?.id,
            realizado: log?.realizado || false,
            data_realizacao: log?.data_realizacao,
            realizado_por: log?.realizado_por,
            realizado_por_nome: log?.profiles?.full_name,
            observacoes: log?.observacoes,
            nao_realizado_motivo: log?.nao_realizado_motivo,
          });
        }
      });

      setAppointments(allAppointments);

      // Group appointments
      const groups: Record<string, MedicalAppointment[]> = {};

      allAppointments.forEach(apt => {
        const groupKey = apt.tipo === 'retorno' ? 'retorno' : apt.tipo_atendimento;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(apt);
      });

      const grouped: GroupedAppointments[] = Object.entries(groups).map(([key, items]) => {
        const groupInfo = APPOINTMENT_GROUPS[key] || { label: key, icon: 'FileText' };
        return {
          grupo: groupInfo.label,
          icon: groupInfo.icon,
          items,
          total: items.length,
          realizados: items.filter(i => i.realizado).length,
        };
      });

      // Sort: Retornos last, others alphabetically
      grouped.sort((a, b) => {
        if (a.grupo === 'Retornos') return 1;
        if (b.grupo === 'Retornos') return -1;
        return a.grupo.localeCompare(b.grupo);
      });

      setGroupedAppointments(grouped);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
      toast({
        title: 'Erro ao carregar consultas',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate, toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const markAsCompleted = async (
    appointment: MedicalAppointment,
    observacoes?: string
  ) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const logData = {
        medical_record_id: appointment.medical_record_id,
        tipo: appointment.tipo,
        data_agendada: appointment.data_agendada,
        realizado: true,
        data_realizacao: new Date().toISOString(),
        realizado_por: user.id,
        observacoes: observacoes || null,
        nao_realizado_motivo: null,
      };

      if (appointment.log_id) {
        const { error } = await supabase
          .from('medical_appointment_log')
          .update(logData)
          .eq('id', appointment.log_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_appointment_log')
          .insert([logData]);
        if (error) throw error;
      }

      await fetchAppointments();
      toast({
        title: 'Atendimento registrado',
        description: 'O atendimento foi marcado como realizado.',
      });
      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    }
  };

  const markAsNotCompleted = async (
    appointment: MedicalAppointment,
    motivo: string,
    observacoes?: string
  ) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const logData = {
        medical_record_id: appointment.medical_record_id,
        tipo: appointment.tipo,
        data_agendada: appointment.data_agendada,
        realizado: false,
        data_realizacao: new Date().toISOString(),
        realizado_por: user.id,
        nao_realizado_motivo: motivo,
        observacoes: observacoes || null,
      };

      if (appointment.log_id) {
        const { error } = await supabase
          .from('medical_appointment_log')
          .update(logData)
          .eq('id', appointment.log_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_appointment_log')
          .insert([logData]);
        if (error) throw error;
      }

      await fetchAppointments();
      toast({
        title: 'Registro salvo',
        description: 'O não comparecimento foi registrado.',
      });
      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    }
  };

  const undoAppointment = async (appointment: MedicalAppointment) => {
    if (!user || !appointment.log_id) return { error: 'Log não encontrado' };

    try {
      const { error } = await supabase
        .from('medical_appointment_log')
        .delete()
        .eq('id', appointment.log_id);

      if (error) throw error;

      await fetchAppointments();
      toast({
        title: 'Registro desfeito',
        description: 'O registro foi removido.',
      });
      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Erro ao desfazer',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    }
  };

  const stats = {
    total: appointments.length,
    realizados: appointments.filter(a => a.realizado && !a.nao_realizado_motivo).length,
    naoRealizados: appointments.filter(a => a.nao_realizado_motivo).length,
    pendentes: appointments.filter(a => !a.log_id).length,
  };

  return {
    appointments,
    groupedAppointments,
    loading,
    error,
    stats,
    fetchAppointments,
    markAsCompleted,
    markAsNotCompleted,
    undoAppointment,
  };
}
