import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export interface StudentMedicalRecord {
  id: string;
  student_id: string;
  data_atendimento: string;
  tipo_atendimento: string;
  especialidade: string | null;
  profissional: string | null;
  local: string | null;
  motivo: string | null;
  diagnostico: string | null;
  prescricao: string | null;
  observacoes: string | null;
  data_retorno: string | null;
  consideracoes: string | null;
  houve_encaminhamento: boolean;
  encaminhamento: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MedicalRecordInput = Omit<StudentMedicalRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const MEDICAL_RECORD_TYPES = [
  { value: 'consulta_medica', label: 'Consulta Médica', icon: 'Stethoscope' },
  { value: 'consulta_odontologica', label: 'Consulta Odontológica', icon: 'Smile' },
  { value: 'consulta_psicologica', label: 'Plantão Psicológico', icon: 'Brain' },
  { value: 'exame_laboratorial', label: 'Exame Laboratorial', icon: 'TestTube' },
  { value: 'exame_imagem', label: 'Exame de Imagem', icon: 'Scan' },
  { value: 'procedimento', label: 'Procedimento', icon: 'Syringe' },
  { value: 'urgencia', label: 'Urgência/Emergência', icon: 'Ambulance' },
  { value: 'outro', label: 'Outro', icon: 'FileText' },
];

export interface MedicalRecordsFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  tipo?: string;
  dateFrom?: string;
  dateTo?: string;
  onlyPendingReturn?: boolean;
  sortDir?: 'asc' | 'desc';
  all?: boolean;
}

export function useStudentMedicalRecords(studentId?: string, filters: MedicalRecordsFilters = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medicalRecords, setMedicalRecords] = useState<StudentMedicalRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);
  const [loading, setLoading] = useState(true);

  const {
    page = 1,
    pageSize = 10,
    search = '',
    tipo = '',
    dateFrom = '',
    dateTo = '',
    onlyPendingReturn = false,
    sortDir = 'desc',
    all = false,
  } = filters;

  const fetchMedicalRecords = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('student_medical_records')
        .select('*', { count: 'exact' })
        .eq('student_id', studentId);

      if (tipo) query = query.eq('tipo_atendimento', tipo);
      if (dateFrom) query = query.gte('data_atendimento', dateFrom);
      if (dateTo) query = query.lte('data_atendimento', dateTo);
      if (onlyPendingReturn) {
        const today = new Date().toISOString().slice(0, 10);
        query = query.gte('data_retorno', today);
      }
      if (search.trim()) {
        const s = search.trim().replace(/[%,]/g, '');
        query = query.or(
          `profissional.ilike.%${s}%,local.ilike.%${s}%,motivo.ilike.%${s}%,diagnostico.ilike.%${s}%,especialidade.ilike.%${s}%`
        );
      }

      query = query.order('data_atendimento', { ascending: sortDir === 'asc' });
      if (!all) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      setMedicalRecords(data || []);
      setTotal(count || 0);

      // total geral (sem filtros) para mostrar "X de Y"
      const { count: countAll } = await supabase
        .from('student_medical_records')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId);
      setTotalAll(countAll || 0);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar prontuário',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, studentId, toast, page, pageSize, search, tipo, dateFrom, dateTo, onlyPendingReturn, sortDir, all]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  const createMedicalRecord = async (data: MedicalRecordInput) => {
    if (!user || !studentId) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_medical_records')
        .insert([{
          ...data,
          student_id: studentId,
          created_by: user.id,
        }]);

      if (error) throw error;
      
      await fetchMedicalRecords();
      toast({
        title: 'Registro salvo',
        description: 'O atendimento foi registrado com sucesso.',
      });
      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    }
  };

  const updateMedicalRecord = async (id: string, data: Partial<MedicalRecordInput>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_medical_records')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      await fetchMedicalRecords();
      toast({
        title: 'Registro atualizado',
        description: 'O atendimento foi atualizado com sucesso.',
      });
      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    }
  };

  const deleteMedicalRecord = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_medical_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchMedicalRecords();
      toast({
        title: 'Registro removido',
        description: 'O atendimento foi removido com sucesso.',
      });
      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Erro ao remover',
        description: err.message,
        variant: 'destructive',
      });
      return { error: err.message };
    }
  };

  return {
    medicalRecords,
    total,
    totalAll,
    loading,
    fetchMedicalRecords,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
  };
}
