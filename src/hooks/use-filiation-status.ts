import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface FiliationStatus {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useFiliationStatus() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<FiliationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('filiation_status')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setStatuses((data as FiliationStatus[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStatuses = async () => {
    if (!user) return { data: [], error: 'User not authenticated' };
    
    try {
      const { data, error } = await supabase
        .from('filiation_status')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return { data: (data as FiliationStatus[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [user]);

  const createStatus = async (statusData: Omit<FiliationStatus, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('filiation_status')
        .insert([statusData])
        .select()
        .single();

      if (error) throw error;
      await fetchStatuses();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateStatus = async (id: string, statusData: Partial<FiliationStatus>) => {
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    try {
      const { data: existingStatus, error: readError } = await supabase
        .from('filiation_status')
        .select('*')
        .eq('id', id)
        .single();

      if (readError || !existingStatus) {
        return { data: null, error: 'Status não encontrado ou sem permissão para editar' };
      }

      const { data, error } = await supabase
        .from('filiation_status')
        .update(statusData)
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return { data: null, error: 'Não foi possível atualizar o status. Verifique suas permissões.' };
      }

      await fetchStatuses();
      return { data: data[0], error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Erro desconhecido ao atualizar status' };
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      // Check if status is in use for mother
      const { data: maeCount } = await supabase
        .from('student_basic_data')
        .select('id', { count: 'exact' })
        .eq('estado_mae', statuses.find(s => s.id === id)?.nome);

      // Check if status is in use for father
      const { data: paiCount } = await supabase
        .from('student_basic_data')
        .select('id', { count: 'exact' })
        .eq('estado_pai', statuses.find(s => s.id === id)?.nome);

      if ((maeCount && maeCount.length > 0) || (paiCount && paiCount.length > 0)) {
        return { error: 'Não é possível excluir um status que está sendo utilizado em cadastros de alunos.' };
      }

      const { error } = await supabase
        .from('filiation_status')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStatuses();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const toggleStatusActive = async (id: string, ativo: boolean) => {
    return updateStatus(id, { ativo });
  };

  return {
    statuses,
    loading,
    error,
    fetchStatuses,
    fetchAllStatuses,
    createStatus,
    updateStatus,
    deleteStatus,
    toggleStatusActive
  };
}
