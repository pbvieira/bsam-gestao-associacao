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
    deleteStudent
  };
}