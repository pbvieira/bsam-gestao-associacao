import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface Student {
  id: string;
  user_id: string;
  codigo_cadastro: string;
  numero_interno: string | null;
  data_abertura: string;
  hora_entrada: string | null;
  nome_completo: string;
  data_nascimento: string;
  cpf: string | null;
  rg: string | null;
  data_saida: string | null;
  hora_saida: string | null;
  nome_responsavel: string | null;
  parentesco_responsavel: string | null;
  ativo: boolean;
  nao_possui_documentos: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const createStudent = async (studentData: {
    nome_completo: string;
    data_nascimento: string;
    ativo?: boolean;
    data_abertura?: string;
    numero_interno?: string | null;
    hora_entrada?: string | null;
    cpf?: string | null;
    rg?: string | null;
    data_saida?: string | null;
    hora_saida?: string | null;
    nome_responsavel?: string | null;
    parentesco_responsavel?: string | null;
    nao_possui_documentos?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{ 
          ...studentData, 
          user_id: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchStudents(); // Refresh list
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateStudent = async (id: string, studentData: Partial<Student>) => {
    try {
      // Converter strings vazias para null nos campos de data/hora
      const cleanedData = {
        ...studentData,
        data_saida: studentData.data_saida === '' ? null : studentData.data_saida,
        hora_saida: studentData.hora_saida === '' ? null : studentData.hora_saida,
      };

      const { data, error } = await supabase
        .from('students')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchStudents(); // Refresh list
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deactivateStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ ativo: false, data_saida: new Date().toISOString().split('T')[0] })
        .eq('id', id);

      if (error) throw error;
      await fetchStudents(); // Refresh list
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const activateStudent = async (
    id: string,
    options?: {
      motivo_saida?: string;
      observacoes?: string;
      nova_data_entrada?: string;
      nova_hora_entrada?: string;
    }
  ) => {
    try {
      // 1. Get current student data to archive
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('data_abertura, hora_entrada, data_saida, hora_saida')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 2. If student has a previous stay with data_saida, archive it
      if (student?.data_saida && user?.id) {
        const { error: stayError } = await supabase
          .from('student_stays')
          .insert([{
            student_id: id,
            data_entrada: student.data_abertura,
            hora_entrada: student.hora_entrada,
            data_saida: student.data_saida,
            hora_saida: student.hora_saida,
            motivo_saida: options?.motivo_saida || null,
            observacoes: options?.observacoes || null,
            created_by: user.id,
          }]);

        if (stayError) throw stayError;
      }

      // 3. Update student with new entry data
      const newDataAbertura = options?.nova_data_entrada || new Date().toISOString().split('T')[0];
      const newHoraEntrada = options?.nova_hora_entrada || null;

      const { error: updateError } = await supabase
        .from('students')
        .update({ 
          ativo: true, 
          data_abertura: newDataAbertura,
          hora_entrada: newHoraEntrada,
          data_saida: null,
          hora_saida: null
        })
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchStudents(); // Refresh list
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStudents(); // Refresh list
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    students,
    loading,
    error,
    fetchStudents,
    createStudent,
    updateStudent,
    deactivateStudent,
    activateStudent,
    deleteStudent
  };
}