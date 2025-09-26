import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./task-card";
import { Task, TaskStatus } from "@/hooks/use-tasks";

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (taskId: string) => void;
}

export function TaskBoard({ tasks, onEditTask }: TaskBoardProps) {
  const statusColumns: Array<{ status: TaskStatus; title: string; count: number }> = [
    { status: 'pendente', title: 'Pendente', count: 0 },
    { status: 'em_andamento', title: 'Em Andamento', count: 0 },
    { status: 'realizada', title: 'Realizada', count: 0 },
    { status: 'cancelada', title: 'Cancelada', count: 0 },
    { status: 'transferida', title: 'Transferida', count: 0 },
  ];

  // Agrupar tarefas por status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Atualizar contagem
  statusColumns.forEach(column => {
    column.count = tasksByStatus[column.status]?.length || 0;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statusColumns.map((column) => (
        <Card key={column.status} className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              <span>{column.title}</span>
              <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
                {column.count}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksByStatus[column.status]?.map((task) => (
              <div key={task.id} className="transform scale-95">
                <TaskCard 
                  task={task} 
                  onEdit={() => onEditTask(task.id)}
                />
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma tarefa
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}