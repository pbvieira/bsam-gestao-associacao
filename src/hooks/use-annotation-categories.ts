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
    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .update(categoryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchCategories();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
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