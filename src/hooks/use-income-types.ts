import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface IncomeType {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface IncomeTypeFormData {
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
}

export function useIncomeTypes() {
  const [incomeTypes, setIncomeTypes] = useState<IncomeType[]>([]);
  const [allIncomeTypes, setAllIncomeTypes] = useState<IncomeType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchIncomeTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('income_types')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setIncomeTypes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tipos de renda:', error);
      toast.error('Erro ao carregar tipos de renda');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllIncomeTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('income_types')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setAllIncomeTypes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tipos de renda:', error);
      toast.error('Erro ao carregar tipos de renda');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createIncomeType = async (data: IncomeTypeFormData) => {
    try {
      const { error } = await supabase
        .from('income_types')
        .insert({
          nome: data.nome,
          descricao: data.descricao || null,
          cor: data.cor || '#6366f1',
          ordem: data.ordem || 0,
        });

      if (error) throw error;
      toast.success('Tipo de renda criado com sucesso');
      await fetchAllIncomeTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar tipo de renda:', error);
      toast.error('Erro ao criar tipo de renda');
      return false;
    }
  };

  const updateIncomeType = async (id: string, data: Partial<IncomeTypeFormData>) => {
    try {
      const { error } = await supabase
        .from('income_types')
        .update({
          nome: data.nome,
          descricao: data.descricao,
          cor: data.cor,
          ordem: data.ordem,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de renda atualizado com sucesso');
      await fetchAllIncomeTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de renda:', error);
      toast.error('Erro ao atualizar tipo de renda');
      return false;
    }
  };

  const deleteIncomeType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('income_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de renda excluído com sucesso');
      await fetchAllIncomeTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir tipo de renda:', error);
      toast.error('Erro ao excluir tipo de renda');
      return false;
    }
  };

  const toggleIncomeTypeStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('income_types')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
      toast.success(ativo ? 'Tipo de renda ativado' : 'Tipo de renda desativado');
      await fetchAllIncomeTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
      return false;
    }
  };

  return {
    incomeTypes,
    allIncomeTypes,
    isLoading,
    fetchIncomeTypes,
    fetchAllIncomeTypes,
    createIncomeType,
    updateIncomeType,
    deleteIncomeType,
    toggleIncomeTypeStatus,
  };
}
