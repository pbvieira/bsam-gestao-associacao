import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CashBookEntryCategory {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CashBookEntryCategoryFormData {
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
}

export function useCashBookEntryCategories() {
  const [categories, setCategories] = useState<CashBookEntryCategory[]>([]);
  const [allCategories, setAllCategories] = useState<CashBookEntryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_book_entry_categories')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias de entrada:', error);
      toast.error('Erro ao carregar categorias de entrada');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_book_entry_categories')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      setAllCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias de entrada:', error);
      toast.error('Erro ao carregar categorias de entrada');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = async (data: CashBookEntryCategoryFormData) => {
    try {
      const { error } = await supabase
        .from('cash_book_entry_categories')
        .insert({
          nome: data.nome,
          descricao: data.descricao || null,
          cor: data.cor || '#10b981',
          ordem: data.ordem || 0,
        });

      if (error) throw error;
      toast.success('Categoria de entrada criada com sucesso');
      await fetchAllCategories();
      return true;
    } catch (error: any) {
      console.error('Erro ao criar categoria de entrada:', error);
      toast.error('Erro ao criar categoria de entrada');
      return false;
    }
  };

  const updateCategory = async (id: string, data: Partial<CashBookEntryCategoryFormData>) => {
    try {
      const { error } = await supabase
        .from('cash_book_entry_categories')
        .update({
          nome: data.nome,
          descricao: data.descricao,
          cor: data.cor,
          ordem: data.ordem,
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Categoria de entrada atualizada com sucesso');
      await fetchAllCategories();
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar categoria de entrada:', error);
      toast.error('Erro ao atualizar categoria de entrada');
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cash_book_entry_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Categoria de entrada excluída com sucesso');
      await fetchAllCategories();
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir categoria de entrada:', error);
      toast.error('Erro ao excluir categoria de entrada');
      return false;
    }
  };

  const toggleCategoryStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from('cash_book_entry_categories')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
      toast.success(ativo ? 'Categoria de entrada ativada' : 'Categoria de entrada desativada');
      await fetchAllCategories();
      return true;
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
      return false;
    }
  };

  return {
    categories,
    allCategories,
    isLoading,
    fetchCategories,
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  };
}
