import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

export interface StudentHospitalization {
  id: string;
  student_id: string;
  data_entrada: string;
  data_saida: string | null;
  tipo_internacao: string;
  local: string | null;
  motivo: string;
  diagnostico: string | null;
  medico_responsavel: string | null;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type HospitalizationInput = Omit<StudentHospitalization, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const HOSPITALIZATION_TYPES = [
  { value: 'psiquiatrica', label: 'Psiquiátrica' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'desintoxicacao', label: 'Desintoxicação' },
  { value: 'cirurgica', label: 'Cirúrgica' },
  { value: 'maternidade', label: 'Maternidade' },
  { value: 'emergencia', label: 'Emergência' },
  { value: 'outra', label: 'Outra' },
];

export function useStudentHospitalizations(studentId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hospitalizations, setHospitalizations] = useState<StudentHospitalization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHospitalizations = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_hospitalizations')
        .select('*')
        .eq('student_id', studentId)
        .order('data_entrada', { ascending: false });

      if (error) throw error;
      setHospitalizations(data || []);
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar internações',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, studentId, toast]);

  useEffect(() => {
    fetchHospitalizations();
  }, [fetchHospitalizations]);

  const createHospitalization = async (data: HospitalizationInput) => {
    if (!user || !studentId) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_hospitalizations')
        .insert([{
          ...data,
          student_id: studentId,
          created_by: user.id,
        }]);

      if (error) throw error;
      
      await fetchHospitalizations();
      toast({
        title: 'Internação registrada',
        description: 'O registro foi salvo com sucesso.',
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

  const updateHospitalization = async (id: string, data: Partial<HospitalizationInput>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_hospitalizations')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      
      await fetchHospitalizations();
      toast({
        title: 'Internação atualizada',
        description: 'O registro foi atualizado com sucesso.',
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

  const deleteHospitalization = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_hospitalizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchHospitalizations();
      toast({
        title: 'Internação removida',
        description: 'O registro foi removido com sucesso.',
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
    hospitalizations,
    loading,
    fetchHospitalizations,
    createHospitalization,
    updateHospitalization,
    deleteHospitalization,
  };
}
