import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VaccineType } from './use-vaccine-types';

export interface StudentVaccine {
  id: string;
  student_id: string;
  vaccine_type_id: string;
  tomou: boolean;
  data_vacinacao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  vaccine_type?: VaccineType;
}

export interface StudentVaccineInput {
  vaccine_type_id: string;
  tomou: boolean;
  data_vacinacao?: string | null;
  observacoes?: string | null;
}

export function useStudentVaccines(studentId?: string) {
  const [vaccines, setVaccines] = useState<StudentVaccine[]>([]);
  const [vaccineTypes, setVaccineTypes] = useState<VaccineType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVaccineTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('vaccine_types')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching vaccine types:', error);
    } else {
      setVaccineTypes(data || []);
    }
  }, []);

  const fetchVaccines = useCallback(async () => {
    if (!studentId) {
      setVaccines([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('student_vaccines')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      console.error('Error fetching student vaccines:', error);
    } else {
      setVaccines(data || []);
    }

    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchVaccineTypes();
  }, [fetchVaccineTypes]);

  useEffect(() => {
    fetchVaccines();
  }, [fetchVaccines]);

  const saveVaccine = async (input: StudentVaccineInput) => {
    if (!studentId) {
      return { error: 'Student ID is required' };
    }

    // Check if vaccine record already exists
    const existingVaccine = vaccines.find(v => v.vaccine_type_id === input.vaccine_type_id);

    if (existingVaccine) {
      // Update existing record
      const { data, error } = await supabase
        .from('student_vaccines')
        .update({
          tomou: input.tomou,
          data_vacinacao: input.data_vacinacao || null,
          observacoes: input.observacoes || null,
        })
        .eq('id', existingVaccine.id)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      setVaccines(prev => prev.map(v => v.id === existingVaccine.id ? data : v));
      return { data };
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('student_vaccines')
        .insert({
          student_id: studentId,
          vaccine_type_id: input.vaccine_type_id,
          tomou: input.tomou,
          data_vacinacao: input.data_vacinacao || null,
          observacoes: input.observacoes || null,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      setVaccines(prev => [...prev, data]);
      return { data };
    }
  };

  const deleteVaccine = async (vaccineTypeId: string) => {
    const vaccine = vaccines.find(v => v.vaccine_type_id === vaccineTypeId);
    if (!vaccine) return { success: true };

    const { error } = await supabase
      .from('student_vaccines')
      .delete()
      .eq('id', vaccine.id);

    if (error) {
      return { error: error.message };
    }

    setVaccines(prev => prev.filter(v => v.id !== vaccine.id));
    return { success: true };
  };

  // Helper to get vaccine status for a specific type
  const getVaccineStatus = (vaccineTypeId: string): { tomou: boolean | null; data: string | null } => {
    const vaccine = vaccines.find(v => v.vaccine_type_id === vaccineTypeId);
    if (!vaccine) {
      return { tomou: null, data: null };
    }
    return { tomou: vaccine.tomou, data: vaccine.data_vacinacao };
  };

  return {
    vaccines,
    vaccineTypes,
    loading,
    fetchVaccines,
    saveVaccine,
    deleteVaccine,
    getVaccineStatus,
  };
}
