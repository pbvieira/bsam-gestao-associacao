import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type TaskStatus = 'pendente' | 'em_andamento' | 'realizada' | 'cancelada' | 'transferida';

export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: TaskPriority;
  status: TaskStatus;
  categoria?: string;
  data_vencimento?: string;
  data_conclusao?: string;
  created_by: string;
  assigned_to: string;
  setor_id?: string;
  estimated_hours?: number;
  actual_hours?: number;
  parent_task_id?: string;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
  updated_at: string;
  created_by_profile?: { full_name: string };
  assigned_to_profile?: { full_name: string };
  setor?: {
    nome: string;
    area_id: string;
    area?: { id: string; nome: string };
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_profile?: { full_name: string };
}

const SELECT_QUERY = `
  *,
  created_by_profile:profiles!tasks_created_by_fkey(full_name),
  assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name),
  setor:setores(nome, area_id, area:areas(id, nome))
`;

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(SELECT_QUERY)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data as any) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
      setTasks([]);
      toast.error('Não foi possível carregar as tarefas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscription with stable channel name
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks(false).catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const fetchTaskById = async (id: string): Promise<Task | null> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(SELECT_QUERY)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return (data as any) || null;
    } catch {
      return null;
    }
  };

  const createTask = async (
    taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by_profile' | 'assigned_to_profile'>
  ) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      toast.success('Tarefa criada com sucesso');
      await fetchTasks();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(msg);
      toast.error(msg);
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id);
      if (error) throw error;
      await fetchTasks();
      toast.success('Tarefa atualizada com sucesso');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(msg);
      toast.error(msg);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Tarefa excluída com sucesso');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      setError(msg);
      toast.error(msg);
      throw err;
    }
  };

  const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`*, user_profile:profiles!task_comments_user_id_fkey(full_name)`)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as any) || [];
    } catch {
      toast.error('Não foi possível carregar os comentários');
      return [];
    }
  };

  const addComment = async (taskId: string, comment: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('task_comments')
        .insert([{ task_id: taskId, user_id: user.id, comment }]);

      if (error) throw error;
      toast.success('Comentário adicionado com sucesso');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar comentário';
      toast.error(msg);
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  const checkTaskExists = async (
    referenceType: string,
    referenceId: string,
    situacao: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .ilike('descricao', `%${situacao}%`)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch {
      return false;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getTaskComments,
    addComment,
    refetch: () => fetchTasks(true),
    fetchTaskById,
    checkTaskExists,
  };
}
