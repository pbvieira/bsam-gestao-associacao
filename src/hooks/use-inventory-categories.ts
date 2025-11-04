import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface InventoryCategory {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export const useInventoryCategories = () => {
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory_categories')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias';
      setError(errorMessage);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('ordem', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias';
      setError(errorMessage);
      console.error('Error fetching all categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: Omit<InventoryCategory, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('inventory_categories')
        .insert([categoryData])
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso",
      });

      await fetchAllCategories();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<InventoryCategory>) => {
    try {
      const { error: updateError } = await supabase
        .from('inventory_categories')
        .update(categoryData)
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso",
      });

      await fetchAllCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if category is in use
      const { data: itemsWithCategory, error: checkError } = await supabase
        .from('inventory_items')
        .select('id')
        .eq('categoria', categories.find(c => c.id === id)?.nome)
        .limit(1);

      if (checkError) throw checkError;

      if (itemsWithCategory && itemsWithCategory.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir uma categoria que está sendo usada por itens do inventário",
          variant: "destructive",
        });
        return false;
      }

      const { error: deleteError } = await supabase
        .from('inventory_categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
      });

      await fetchAllCategories();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir categoria';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const toggleCategoryStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('inventory_categories')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: `Categoria ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`,
      });

      await fetchAllCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status da categoria';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
  };
};
