import { useNavigate } from "react-router-dom";
import { useTasks } from "./use-tasks";
import { useToast } from "./use-toast";

export function useQuickActions() {
  const navigate = useNavigate();
  const { tasks, updateTask } = useTasks();
  const { toast } = useToast();

  const markLastTaskComplete = async () => {
    try {
      // Encontrar a última tarefa pendente do usuário
      const pendingTasks = tasks.filter(task => task.status === 'pendente');
      
      if (pendingTasks.length === 0) {
        toast({
          title: "Nenhuma tarefa pendente",
          description: "Você não tem tarefas pendentes para marcar como concluída.",
          variant: "default"
        });
        return;
      }

      // Pegar a tarefa mais recente
      const lastTask = pendingTasks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      await updateTask(lastTask.id, { status: 'realizada' });

      toast({
        title: "Tarefa concluída!",
        description: `"${lastTask.titulo}" foi marcada como concluída.`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao marcar tarefa como concluída:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a tarefa como concluída.",
        variant: "destructive"
      });
    }
  };

  const createQuickTask = () => {
    navigate('/tarefas', { state: { openForm: true } });
  };

  const createQuickEvent = () => {
    navigate('/calendario', { state: { openForm: true } });
  };

  return {
    markLastTaskComplete,
    createQuickTask,
    createQuickEvent
  };
}