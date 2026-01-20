import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { format, isToday, parseISO, getDay } from 'date-fns';
import { toast } from 'sonner';

export interface MedicationAdministration {
  id: string;
  student_id: string;
  student_name: string;
  student_codigo: string;
  medication_id: string;
  medication_name: string;
  dosagem: string | null;
  principio_ativo: string | null;
  schedule_id: string;
  horario: string;
  setor_responsavel_id: string | null;
  setor_nome: string | null;
  instrucoes: string | null;
  frequencia: string;
  
  // Log status
  log_id?: string;
  administrado: boolean;
  data_administracao?: string;
  administrado_por?: string;
  administrado_por_nome?: string;
  observacoes?: string;
  nao_administrado_motivo?: string;
}

export interface GroupedMedications {
  horario: string;
  items: MedicationAdministration[];
  total: number;
  administrados: number;
}

// Map day number to Portuguese day name
const dayNumberToName: { [key: number]: string } = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

export function useMedicationAdministration(date: Date) {
  const { user } = useAuth();
  const [medications, setMedications] = useState<MedicationAdministration[]>([]);
  const [groupedMedications, setGroupedMedications] = useState<GroupedMedications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMedications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const dayOfWeek = getDay(date);
      const dayName = dayNumberToName[dayOfWeek];

      // Fetch active medication schedules with medication and student info
      const { data: schedules, error: schedulesError } = await supabase
        .from('medication_schedules')
        .select(`
          id,
          horario,
          frequencia,
          dias_semana,
          instrucoes,
          setor_responsavel_id,
          medication:student_medications!inner(
            id,
            nome_medicamento,
            dosagem,
            principio_ativo,
            data_inicio,
            data_fim,
            ativo,
            student:students!inner(
              id,
              nome_completo,
              codigo_cadastro,
              ativo
            )
          ),
          setor:setores(
            id,
            nome
          )
        `)
        .eq('ativo', true)
        .eq('medication.ativo', true)
        .eq('medication.student.ativo', true);

      if (schedulesError) throw schedulesError;

      // Filter schedules based on frequency and date
      const validSchedules = (schedules || []).filter((schedule: any) => {
        const medication = schedule.medication;
        
        // Check if medication is within date range
        if (medication.data_inicio && formattedDate < medication.data_inicio) return false;
        if (medication.data_fim && formattedDate > medication.data_fim) return false;

        // Check frequency
        const freq = schedule.frequencia;
        
        if (freq === 'diaria') return true;
        
        if (freq === 'semanal' || freq === 'dias_especificos') {
          const diasSemana = schedule.dias_semana || [];
          return diasSemana.includes(dayName);
        }
        
        if (freq === 'dias_alternados') {
          // For alternating days, check if it's an even or odd day from start
          if (!medication.data_inicio) return true;
          const startDate = parseISO(medication.data_inicio);
          const diffDays = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays % 2 === 0;
        }
        
        return true;
      });

      // Fetch existing logs for this date
      const { data: logs, error: logsError } = await supabase
        .from('medication_administration_log')
        .select(`
          id,
          schedule_id,
          horario_agendado,
          administrado,
          data_administracao,
          administrado_por,
          observacoes,
          nao_administrado_motivo
        `)
        .eq('data_agendada', formattedDate);

      if (logsError) throw logsError;

      // Get admin user names
      const adminUserIds = (logs || [])
        .filter(log => log.administrado_por)
        .map(log => log.administrado_por);
      
      let adminProfiles: { [key: string]: string } = {};
      if (adminUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', adminUserIds);
        
        if (profiles) {
          adminProfiles = profiles.reduce((acc, p) => {
            acc[p.user_id] = p.full_name;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      // Create logs map for quick lookup
      const logsMap = new Map<string, any>();
      (logs || []).forEach(log => {
        const key = `${log.schedule_id}-${log.horario_agendado}`;
        logsMap.set(key, log);
      });

      // Transform schedules to MedicationAdministration
      const medicationItems: MedicationAdministration[] = validSchedules.map((schedule: any) => {
        const medication = schedule.medication;
        const student = medication.student;
        const setor = schedule.setor;
        const logKey = `${schedule.id}-${schedule.horario}`;
        const log = logsMap.get(logKey);

        return {
          id: `${schedule.id}-${formattedDate}`,
          student_id: student.id,
          student_name: student.nome_completo,
          student_codigo: student.codigo_cadastro,
          medication_id: medication.id,
          medication_name: medication.nome_medicamento,
          dosagem: medication.dosagem,
          principio_ativo: medication.principio_ativo,
          schedule_id: schedule.id,
          horario: schedule.horario,
          setor_responsavel_id: schedule.setor_responsavel_id,
          setor_nome: setor?.nome || null,
          instrucoes: schedule.instrucoes,
          frequencia: schedule.frequencia,
          
          // Log data
          log_id: log?.id,
          administrado: log?.administrado || false,
          data_administracao: log?.data_administracao,
          administrado_por: log?.administrado_por,
          administrado_por_nome: log?.administrado_por ? adminProfiles[log.administrado_por] : undefined,
          observacoes: log?.observacoes,
          nao_administrado_motivo: log?.nao_administrado_motivo
        };
      });

      // Sort by time and student name
      medicationItems.sort((a, b) => {
        if (a.horario !== b.horario) {
          return a.horario.localeCompare(b.horario);
        }
        return a.student_name.localeCompare(b.student_name);
      });

      setMedications(medicationItems);

      // Group by time
      const grouped = medicationItems.reduce((acc, item) => {
        const existing = acc.find(g => g.horario === item.horario);
        if (existing) {
          existing.items.push(item);
          existing.total++;
          if (item.administrado) existing.administrados++;
        } else {
          acc.push({
            horario: item.horario,
            items: [item],
            total: 1,
            administrados: item.administrado ? 1 : 0
          });
        }
        return acc;
      }, [] as GroupedMedications[]);

      setGroupedMedications(grouped);

    } catch (err: any) {
      console.error('Error fetching medications:', err);
      setError(err.message || 'Erro ao carregar medicamentos');
      toast.error('Erro ao carregar medicamentos');
    } finally {
      setLoading(false);
    }
  }, [date, user]);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  const markAsAdministered = async (
    item: MedicationAdministration,
    observacoes?: string
  ) => {
    if (!user) return;

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const now = new Date().toISOString();

      if (item.log_id) {
        // Update existing log
        const { error } = await supabase
          .from('medication_administration_log')
          .update({
            administrado: true,
            data_administracao: now,
            administrado_por: user.id,
            observacoes,
            nao_administrado_motivo: null
          })
          .eq('id', item.log_id);

        if (error) throw error;
      } else {
        // Create new log
        const { error } = await supabase
          .from('medication_administration_log')
          .insert({
            medication_id: item.medication_id,
            schedule_id: item.schedule_id,
            student_id: item.student_id,
            data_agendada: formattedDate,
            horario_agendado: item.horario,
            administrado: true,
            data_administracao: now,
            administrado_por: user.id,
            observacoes
          });

        if (error) throw error;
      }

      toast.success('Medicamento registrado como administrado');
      fetchMedications();
    } catch (err: any) {
      console.error('Error marking as administered:', err);
      toast.error('Erro ao registrar administração');
    }
  };

  const markAsNotAdministered = async (
    item: MedicationAdministration,
    motivo: string,
    observacoes?: string
  ) => {
    if (!user) return;

    try {
      const formattedDate = format(date, 'yyyy-MM-dd');

      if (item.log_id) {
        // Update existing log
        const { error } = await supabase
          .from('medication_administration_log')
          .update({
            administrado: false,
            data_administracao: null,
            administrado_por: user.id,
            observacoes,
            nao_administrado_motivo: motivo
          })
          .eq('id', item.log_id);

        if (error) throw error;
      } else {
        // Create new log
        const { error } = await supabase
          .from('medication_administration_log')
          .insert({
            medication_id: item.medication_id,
            schedule_id: item.schedule_id,
            student_id: item.student_id,
            data_agendada: formattedDate,
            horario_agendado: item.horario,
            administrado: false,
            administrado_por: user.id,
            observacoes,
            nao_administrado_motivo: motivo
          });

        if (error) throw error;
      }

      toast.success('Registro salvo');
      fetchMedications();
    } catch (err: any) {
      console.error('Error marking as not administered:', err);
      toast.error('Erro ao registrar');
    }
  };

  const undoAdministration = async (item: MedicationAdministration) => {
    if (!item.log_id) return;

    try {
      const { error } = await supabase
        .from('medication_administration_log')
        .delete()
        .eq('id', item.log_id);

      if (error) throw error;

      toast.success('Registro removido');
      fetchMedications();
    } catch (err: any) {
      console.error('Error undoing administration:', err);
      toast.error('Erro ao remover registro');
    }
  };

  return {
    medications,
    groupedMedications,
    loading,
    error,
    markAsAdministered,
    markAsNotAdministered,
    undoAdministration,
    refetch: fetchMedications
  };
}
