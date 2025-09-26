import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  estimated_hours?: number;
  actual_hours?: number;
  parent_task_id?: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    full_name: string;
  };
  assigned_to_profile?: {
    full_name: string;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_profile?: {
    full_name: string;
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Real-time subscription
  useEffect(() => {
    console.log('Setting up realtime subscription for tasks...');
    
    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        }, 
        (payload) => {
          console.log('Task realtime update:', payload);
          
          // Refresh tasks when any change occurs
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription for tasks...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Função para buscar uma tarefa específica
  const fetchTaskById = async (id: string): Promise<Task | null> => {
    try {
      console.log('Fetching fresh task data for ID:', id);
      
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          created_by_profile:profiles!tasks_created_by_fkey(full_name),
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      console.log('Fresh task data fetched:', data);
      return data as Task;
    } catch (err) {
      console.error('Error fetching task by ID:', err);
      return null;
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          created_by_profile:profiles!tasks_created_by_fkey(full_name),
          assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
      setTasks([]); // Set empty array on error
      toast({
        title: "Erro",
        description: "Não foi possível carregar as tarefas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by_profile' | 'assigned_to_profile'>) => {
    try {
      console.log('Creating task with data:', taskData);
      
      // Validar dados obrigatórios
      if (!taskData.titulo?.trim()) {
        throw new Error('Título é obrigatório');
      }
      if (!taskData.assigned_to) {
        throw new Error('Responsável é obrigatório');
      }
      if (!taskData.created_by) {
        throw new Error('Criador é obrigatório');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }

      console.log('Task created successfully:', data);
      
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso",
      });

      await fetchTasks();
      return data;
    } catch (err) {
      console.error('Error creating task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      console.log('Updating task:', id, 'with data:', updates);
      
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      console.log('Task updated successfully in database');

      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso",
      });

      // Return success indicator
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso",
      });

      await fetchTasks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getTaskComments = async (taskId: string): Promise<TaskComment[]> => {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          user_profile:profiles!task_comments_user_id_fkey(full_name)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data as any) || [];
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os comentários",
        variant: "destructive",
      });
      return [];
    }
  };

  const addComment = async (taskId: string, comment: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          comment
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comentário adicionado com sucesso",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar comentário';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    getTaskComments,
    addComment,
    refetch: fetchTasks,
    fetchTaskById,
  };
}