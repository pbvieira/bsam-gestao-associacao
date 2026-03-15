import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Child {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  student_children_id: string;
}

interface ChildrenInfo {
  convive_filhos: boolean;
  paga_pensao: boolean;
  valor_pensao: number | null;
}

export function useStudentChildren(studentId?: string) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [childrenRecordId, setChildrenRecordId] = useState<string | null>(null);
  const [childrenInfo, setChildrenInfo] = useState<ChildrenInfo>({
    convive_filhos: false,
    paga_pensao: false,
    valor_pensao: null,
  });

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
      
      const { data: childrenData, error: childrenError } = await supabase
        .from('student_children')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (childrenError) throw childrenError;

      let recordId = childrenData?.id;

      if (!recordId) {
        const { data: newRecord, error: createError } = await supabase
          .from('student_children')
          .insert({ 
            student_id: studentId,
            tem_filhos: false,
            quantidade_filhos: 0,
            convive_filhos: false,
            paga_pensao: false,
          })
          .select()
          .single();

        if (createError) throw createError;
        recordId = newRecord.id;
        setChildrenInfo({
          convive_filhos: false,
          paga_pensao: false,
          valor_pensao: null,
        });
      } else {
        setChildrenInfo({
          convive_filhos: childrenData.convive_filhos ?? false,
          paga_pensao: (childrenData as any).paga_pensao ?? false,
          valor_pensao: (childrenData as any).valor_pensao ?? null,
        });
      }

      setChildrenRecordId(recordId);

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

  const updateChildrenInfo = async (info: Partial<ChildrenInfo>) => {
    if (!childrenRecordId) return { error: 'Registro não encontrado' };

    try {
      const updateData: any = {};
      if (info.convive_filhos !== undefined) updateData.convive_filhos = info.convive_filhos;
      if (info.paga_pensao !== undefined) updateData.paga_pensao = info.paga_pensao;
      if (info.valor_pensao !== undefined) updateData.valor_pensao = info.valor_pensao;

      // If switching to convive_filhos=true, reset pensão fields
      if (info.convive_filhos === true) {
        updateData.paga_pensao = false;
        updateData.valor_pensao = null;
      }

      // If switching paga_pensao to false, reset valor
      if (info.paga_pensao === false) {
        updateData.valor_pensao = null;
      }

      const { error } = await supabase
        .from('student_children')
        .update(updateData)
        .eq('id', childrenRecordId);

      if (error) throw error;

      setChildrenInfo(prev => {
        const updated = { ...prev, ...updateData };
        return updated;
      });

      return { error: null };
    } catch (error) {
      console.error('Error updating children info:', error);
      return { error: 'Erro ao atualizar informações' };
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
    childrenInfo,
    loading,
    createChild,
    updateChild,
    deleteChild,
    updateChildrenInfo,
  };
}
