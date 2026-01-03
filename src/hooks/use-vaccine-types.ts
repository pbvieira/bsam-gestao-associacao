import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VaccineType {
  id: string;
  nome: string;
  descricao: string | null;
  informacao_adicional: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaccineTypeInput {
  nome: string;
  descricao?: string;
  informacao_adicional?: string;
  cor?: string;
}

export function useVaccineTypes() {
  const [types, setTypes] = useState<VaccineType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vaccine_types')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching vaccine types:', error);
    } else {
      setTypes(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const createType = async (input: VaccineTypeInput) => {
    const maxOrdem = types.length > 0 ? Math.max(...types.map(t => t.ordem)) + 1 : 1;

    const { data, error } = await supabase
      .from('vaccine_types')
      .insert({
        nome: input.nome,
        descricao: input.descricao || null,
        informacao_adicional: input.informacao_adicional || null,
        cor: input.cor || '#6366f1',
        ordem: maxOrdem,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setTypes(prev => [...prev, data]);
    return { data };
  };

  const updateType = async (id: string, input: VaccineTypeInput) => {
    const { data, error } = await supabase
      .from('vaccine_types')
      .update({
        nome: input.nome,
        descricao: input.descricao || null,
        informacao_adicional: input.informacao_adicional || null,
        cor: input.cor,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    setTypes(prev => prev.map(t => t.id === id ? data : t));
    return { data };
  };

  const toggleStatus = async (id: string, ativo: boolean) => {
    const { error } = await supabase
      .from('vaccine_types')
      .update({ ativo })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    setTypes(prev => prev.map(t => t.id === id ? { ...t, ativo } : t));
    return { success: true };
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase
      .from('vaccine_types')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    setTypes(prev => prev.filter(t => t.id !== id));
    return { success: true };
  };

  return {
    types,
    loading,
    fetchTypes,
    createType,
    updateType,
    toggleStatus,
    deleteType,
  };
}
