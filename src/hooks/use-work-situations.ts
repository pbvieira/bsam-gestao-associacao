import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface WorkSituation {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  gerar_tarefa: boolean;
  texto_tarefa: string | null;
  setor_tarefa_id: string | null;
  prioridade_tarefa: string;
  created_at: string;
  updated_at: string;
}

export interface WorkSituationFormData {
  nome: string;
  descricao?: string | null;
  cor?: string;
  ordem?: number;
  ativo?: boolean;
  gerar_tarefa?: boolean;
  texto_tarefa?: string | null;
  setor_tarefa_id?: string | null;
  prioridade_tarefa?: string;
}

export function useWorkSituations() {
  const { user } = useAuth();
  const [workSituations, setWorkSituations] = useState<WorkSituation[]>([]);
  const [allWorkSituations, setAllWorkSituations] = useState<WorkSituation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkSituations = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('work_situations')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setWorkSituations((data as WorkSituation[]) || []);
    } catch (error) {
      console.error('Error fetching work situations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAllWorkSituations = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('work_situations')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setAllWorkSituations((data as WorkSituation[]) || []);
    } catch (error) {
      console.error('Error fetching all work situations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWorkSituations();
  }, [fetchWorkSituations]);

  const createWorkSituation = async (data: WorkSituationFormData) => {
    const { data: result, error } = await supabase
      .from('work_situations')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    await fetchAllWorkSituations();
    await fetchWorkSituations();
    return result;
  };

  const updateWorkSituation = async (id: string, data: Partial<WorkSituationFormData>) => {
    const { error } = await supabase
      .from('work_situations')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    await fetchAllWorkSituations();
    await fetchWorkSituations();
  };

  const deleteWorkSituation = async (id: string) => {
    const { error } = await supabase
      .from('work_situations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchAllWorkSituations();
    await fetchWorkSituations();
  };

  const toggleWorkSituationStatus = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('work_situations')
      .update({ ativo })
      .eq('id', id);

    if (error) throw error;
    await fetchAllWorkSituations();
    await fetchWorkSituations();
  };

  return {
    workSituations,
    allWorkSituations,
    isLoading,
    fetchWorkSituations,
    fetchAllWorkSituations,
    createWorkSituation,
    updateWorkSituation,
    deleteWorkSituation,
    toggleWorkSituationStatus
  };
}
