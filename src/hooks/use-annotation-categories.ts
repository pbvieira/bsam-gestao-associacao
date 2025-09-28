import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface AnnotationCategory {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useAnnotationCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<AnnotationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    if (!user) return { data: [], error: 'User not authenticated' };
    
    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err: any) {
      return { data: [], error: err.message };
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const createCategory = async (categoryData: Omit<AnnotationCategory, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) throw error;
      await fetchCategories();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<AnnotationCategory>) => {
    if (!user) {
      console.error('useAnnotationCategories: User not authenticated for update');
      return { data: null, error: 'User not authenticated' };
    }

    console.log('useAnnotationCategories: Updating category:', id, 'with data:', categoryData);
    
    try {
      // First verify we have permission by checking if we can read the category
      const { data: existingCategory, error: readError } = await supabase
        .from('annotation_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (readError || !existingCategory) {
        console.error('useAnnotationCategories: Cannot read category for update:', readError);
        return { data: null, error: 'Categoria não encontrada ou sem permissão para editar' };
      }

      // Perform the update without .single() to avoid PGRST116 error
      const { data, error, count } = await supabase
        .from('annotation_categories')
        .update(categoryData)
        .eq('id', id)
        .select();

      console.log('useAnnotationCategories: Supabase update response:', { data, error, count });

      if (error) {
        throw error;
      }

      // Check if any rows were actually updated
      if (!data || data.length === 0) {
        console.error('useAnnotationCategories: No rows updated - possible permission issue');
        return { data: null, error: 'Não foi possível atualizar a categoria. Verifique suas permissões.' };
      }

      await fetchCategories();
      return { data: data[0], error: null };
    } catch (err: any) {
      console.error('useAnnotationCategories: Error updating category:', err);
      
      // Provide specific error messages
      if (err.code === 'PGRST116') {
        return { data: null, error: 'Erro de permissão: não é possível editar esta categoria' };
      }
      
      return { data: null, error: err.message || 'Erro desconhecido ao atualizar categoria' };
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      // Check if category is in use
      const { data: annotationsCount } = await supabase
        .from('student_annotations')
        .select('id', { count: 'exact' })
        .eq('categoria', categories.find(c => c.id === id)?.nome);

      if (annotationsCount && annotationsCount.length > 0) {
        return { error: 'Não é possível excluir uma categoria que possui anotações associadas.' };
      }

      const { error } = await supabase
        .from('annotation_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchCategories();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const toggleCategoryStatus = async (id: string, ativo: boolean) => {
    return updateCategory(id, { ativo });
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
  };
}