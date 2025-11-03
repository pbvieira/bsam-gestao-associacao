import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskStats } from "@/components/tasks/task-stats";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTasks, TaskPriority, TaskStatus } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";

const Tasks = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const location = useLocation();

  const { tasks, loading } = useTasks();
  const { canAccess } = useAuth();

  // Abrir formulário automaticamente se vier do dashboard
  useEffect(() => {
    if (location.state?.openForm) {
      setIsFormOpen(true);
      // Limpar o state para evitar reabrir ao voltar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const canCreateTasks = canAccess('tasks');

  const handleTaskCreated = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setIsFormOpen(true);
  };

  const actionButton = canCreateTasks ? (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setEditingTask(null)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>
        <TaskForm 
          taskId={editingTask} 
          onSuccess={handleTaskCreated}
        />
      </DialogContent>
    </Dialog>
  ) : undefined;

  return (
    <MainLayout>
      <PageLayout
        title="Gestão de Tarefas"
        subtitle="Organize e acompanhe o progresso das tarefas da equipe"
        actionButton={actionButton}
        statsCards={<TaskStats tasks={tasks} />}
      >
        <TaskList 
          tasks={tasks}
          loading={loading}
          onEditTask={handleEditTask}
        />
      </PageLayout>
    </MainLayout>
  );
};

export default Tasks;