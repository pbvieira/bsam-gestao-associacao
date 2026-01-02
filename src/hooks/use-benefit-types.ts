import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BenefitType {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface BenefitTypeFormData {
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
}

export function useBenefitTypes() {
  const [benefitTypes, setBenefitTypes] = useState<BenefitType[]>([]);
  const [allBenefitTypes, setAllBenefitTypes] = useState<BenefitType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBenefitTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('benefit_types')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setBenefitTypes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tipos de benefício:', error);
      toast.error('Erro ao carregar tipos de benefício');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllBenefitTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('benefit_types')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setAllBenefitTypes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar tipos de benefício:', error);
      toast.error('Erro ao carregar tipos de benefício');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createBenefitType = async (data: BenefitTypeFormData) => {
    try {
      const { error } = await supabase
        .from('benefit_types')
        .insert({
          nome: data.nome,
          descricao: data.descricao || null,
          cor: data.cor || '#6366f1',
          ordem: data.ordem || 0,
        });

      if (error) throw error;
      toast.success('Tipo de benefício criado com sucesso');
      await fetchAllBenefitTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar tipo de benefício:', error);
      toast.error('Erro ao criar tipo de benefício');
      return false;
    }
  };

  const updateBenefitType = async (id: string, data: Partial<BenefitTypeFormData>) => {
    try {
      const { error } = await supabase
        .from('benefit_types')
        .update({
          nome: data.nome,
          descricao: data.descricao,
          cor: data.cor,
          ordem: data.ordem,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de benefício atualizado com sucesso');
      await fetchAllBenefitTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar tipo de benefício:', error);
      toast.error('Erro ao atualizar tipo de benefício');
      return false;
    }
  };

  const deleteBenefitType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('benefit_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de benefício excluído com sucesso');
      await fetchAllBenefitTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir tipo de benefício:', error);
      toast.error('Erro ao excluir tipo de benefício');
      return false;
    }
  };

  const toggleBenefitTypeStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('benefit_types')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
      toast.success(ativo ? 'Tipo de benefício ativado' : 'Tipo de benefício desativado');
      await fetchAllBenefitTypes();
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
      return false;
    }
  };

  return {
    benefitTypes,
    allBenefitTypes,
    isLoading,
    fetchBenefitTypes,
    fetchAllBenefitTypes,
    createBenefitType,
    updateBenefitType,
    deleteBenefitType,
    toggleBenefitTypeStatus,
  };
}
