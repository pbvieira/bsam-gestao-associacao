import { TaskCard } from "./task-card";
import { TaskBoard } from "./task-board";
import { Button } from "@/components/ui/button";
import { Grid, List } from "lucide-react";
import { useState } from "react";
import { Task } from "@/hooks/use-tasks";

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onEditTask: (taskId: string) => void;
}

export function TaskList({ tasks, loading, onEditTask }: TaskListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
          <p className="text-sm">Crie uma nova tarefa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle de visualização */}
      <div className="flex justify-end">
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8"
          >
            <List className="w-4 h-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('board')}
            className="h-8"
          >
            <Grid className="w-4 h-4 mr-2" />
            Quadro
          </Button>
        </div>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={() => onEditTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <TaskBoard 
          tasks={tasks} 
          onEditTask={onEditTask}
        />
      )}
    </div>
  );
}