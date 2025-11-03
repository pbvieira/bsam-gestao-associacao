import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Child {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  student_children_id: string;
}

export function useStudentChildren(studentId?: string) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [childrenRecordId, setChildrenRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      fetchChildren();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      
      // First, get or create the student_children record
      const { data: childrenData, error: childrenError } = await supabase
        .from('student_children')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (childrenError) throw childrenError;

      let recordId = childrenData?.id;

      // If no record exists, create one
      if (!recordId) {
        const { data: newRecord, error: createError } = await supabase
          .from('student_children')
          .insert({ 
            student_id: studentId,
            tem_filhos: false,
            quantidade_filhos: 0,
            convive_filhos: false
          })
          .select()
          .single();

        if (createError) throw createError;
        recordId = newRecord.id;
      }

      setChildrenRecordId(recordId);

      // Fetch children list
      const { data: childrenList, error: listError } = await supabase
        .from('student_children_list')
        .select('*')
        .eq('student_children_id', recordId)
        .order('data_nascimento', { ascending: false });

      if (listError) throw listError;
      setChildren(childrenList || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    } finally {
      setLoading(false);
    }
  };

  const createChild = async (childData: Omit<Child, 'id' | 'student_children_id'>) => {
    if (!childrenRecordId) {
      return { error: 'Registro de filhos não encontrado' };
    }

    try {
      const { error } = await supabase
        .from('student_children_list')
        .insert({
          ...childData,
          student_children_id: childrenRecordId
        });

      if (error) throw error;

      // Update tem_filhos and quantidade_filhos
      await supabase
        .from('student_children')
        .update({
          tem_filhos: true,
          quantidade_filhos: children.length + 1
        })
        .eq('id', childrenRecordId);

      await fetchChildren();
      return { error: null };
    } catch (error) {
      console.error('Error creating child:', error);
      return { error: 'Erro ao adicionar filho' };
    }
  };

  const updateChild = async (childId: string, childData: Omit<Child, 'id' | 'student_children_id'>) => {
    try {
      const { error } = await supabase
        .from('student_children_list')
        .update(childData)
        .eq('id', childId);

      if (error) throw error;

      await fetchChildren();
      return { error: null };
    } catch (error) {
      console.error('Error updating child:', error);
      return { error: 'Erro ao atualizar filho' };
    }
  };

  const deleteChild = async (childId: string) => {
    try {
      const { error } = await supabase
        .from('student_children_list')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      // Update tem_filhos and quantidade_filhos
      const newCount = children.length - 1;
      await supabase
        .from('student_children')
        .update({
          tem_filhos: newCount > 0,
          quantidade_filhos: newCount
        })
        .eq('id', childrenRecordId);

      await fetchChildren();
      return { error: null };
    } catch (error) {
      console.error('Error deleting child:', error);
      return { error: 'Erro ao remover filho' };
    }
  };

  return {
    children,
    loading,
    createChild,
    updateChild,
    deleteChild,
  };
}
