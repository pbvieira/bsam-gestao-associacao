import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface MedicationUsageType {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useMedicationUsageTypes() {
  const { user } = useAuth();
  const [types, setTypes] = useState<MedicationUsageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTypes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medication_usage_types')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setTypes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [user]);

  const createType = async (data: { nome: string; descricao?: string; cor?: string }) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const maxOrdem = types.length > 0 ? Math.max(...types.map(t => t.ordem)) : 0;
      
      const { error } = await supabase
        .from('medication_usage_types')
        .insert([{ nome: data.nome, descricao: data.descricao, cor: data.cor, ordem: maxOrdem + 1 }]);

      if (error) throw error;
      await fetchTypes();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const updateType = async (id: string, data: Partial<MedicationUsageType>) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('medication_usage_types')
        .update(data)
        .eq('id', id);

      if (error) throw error;
      await fetchTypes();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const toggleStatus = async (id: string, ativo: boolean) => {
    return updateType(id, { ativo });
  };

  const deleteType = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('medication_usage_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTypes();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    types,
    loading,
    error,
    fetchTypes,
    createType,
    updateType,
    toggleStatus,
    deleteType
  };
}
