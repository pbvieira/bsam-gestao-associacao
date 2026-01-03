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
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type MedicalRecordInput = Omit<StudentMedicalRecord, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const MEDICAL_RECORD_TYPES = [
  { value: 'consulta_medica', label: 'Consulta Médica', icon: 'Stethoscope' },
  { value: 'consulta_odontologica', label: 'Consulta Odontológica', icon: 'Smile' },
  { value: 'consulta_psicologica', label: 'Consulta Psicológica', icon: 'Brain' },
  { value: 'exame_laboratorial', label: 'Exame Laboratorial', icon: 'TestTube' },
  { value: 'exame_imagem', label: 'Exame de Imagem', icon: 'Scan' },
  { value: 'procedimento', label: 'Procedimento', icon: 'Syringe' },
  { value: 'urgencia', label: 'Urgência/Emergência', icon: 'Ambulance' },
  { value: 'outro', label: 'Outro', icon: 'FileText' },
];

export function useStudentMedicalRecords(studentId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medicalRecords, setMedicalRecords] = useState<StudentMedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedicalRecords = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_medical_records')
        .select('*')
        .eq('student_id', studentId)
        .order('data_atendimento', { ascending: false });

      if (error) throw error;
      setMedicalRecords(data || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar prontuário',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, studentId, toast]);

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
    loading,
    fetchMedicalRecords,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
  };
}
