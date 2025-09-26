import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { TaskList } from "@/components/tasks/task-list";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTasks, TaskPriority, TaskStatus } from "@/hooks/use-tasks";
import { usePermissions } from "@/hooks/use-permissions";

const Tasks = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const { tasks, loading } = useTasks();
  const { hasPermission } = usePermissions();

  const canCreateTasks = hasPermission('tasks', 'create');

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.prioridade === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const priorityLabels = {
    baixa: "Baixa",
    media: "Média", 
    alta: "Alta",
    urgente: "Urgente"
  };

  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    realizada: "Realizada",
    cancelada: "Cancelada",
    transferida: "Transferida"
  };

  const handleTaskCreated = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setIsFormOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Gestão de Tarefas</h1>
            {canCreateTasks && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingTask(null)}>
                    <Plus className="w-4 h-4 mr-2" />
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
            )}
          </div>
          <p className="text-muted-foreground">
            Organize e acompanhe o progresso das tarefas da equipe
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | "all")}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Tarefas */}
        <TaskList 
          tasks={filteredTasks}
          loading={loading}
          onEditTask={handleEditTask}
        />
      </div>
    </MainLayout>
  );
};

export default Tasks;