import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { useQuickActions } from "@/hooks/use-quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckSquare, Clock, AlertCircle, Plus } from "lucide-react";
import { format, isToday, isPast, isFuture } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task } from "@/hooks/use-tasks";

export function TodayTasks() {
  const { tasks, updateTask } = useTasks();
  const { profile } = useAuth();
  const { createQuickTask } = useQuickActions();

  const myTasks = tasks.filter(task => 
    task.assigned_to === profile?.user_id || task.created_by === profile?.user_id
  );

  const pendingTasks = myTasks.filter(task => task.status === 'pendente');

  const todayTasks = pendingTasks.filter(task => {
    if (!task.data_vencimento) return false;
    const dueDate = new Date(task.data_vencimento);
    return isToday(dueDate);
  });

  const overdueTasks = pendingTasks.filter(task => {
    if (!task.data_vencimento) return false;
    const dueDate = new Date(task.data_vencimento);
    return isPast(dueDate) && !isToday(dueDate);
  });

  const upcomingTasks = pendingTasks.filter(task => {
    if (!task.data_vencimento) return false;
    const dueDate = new Date(task.data_vencimento);
    return isFuture(dueDate) && !isToday(dueDate);
  }).slice(0, 5);

  const priorityTasks = pendingTasks.filter(task => 
    task.prioridade === 'alta'
  );

  const otherTasks = pendingTasks.filter(task => {
    if (task.prioridade === 'alta') return false;
    if (task.data_vencimento) {
      const dueDate = new Date(task.data_vencimento);
      return !isToday(dueDate) && !isPast(dueDate) && !isFuture(dueDate);
    }
    return true; // Tasks without due date
  }).slice(0, 3);

  const handleTaskComplete = async (task: Task) => {
    await updateTask(task.id, {
      status: task.status === 'realizada' ? 'pendente' : 'realizada',
      data_conclusao: task.status === 'realizada' ? null : new Date().toISOString()
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-danger text-danger-foreground';
      case 'media': return 'bg-warning text-warning-foreground';
      case 'baixa': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const TaskItem = ({ task, showOverdue = false }: { task: Task; showOverdue?: boolean }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      showOverdue ? 'border-danger bg-danger/5' : 'border-border'
    }`}>
      <Checkbox
        checked={task.status === 'realizada'}
        onCheckedChange={() => handleTaskComplete(task)}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={`font-medium truncate ${
            task.status === 'realizada' ? 'line-through text-muted-foreground' : ''
          }`}>
            {task.titulo}
          </p>
          <Badge className={getPriorityColor(task.prioridade)}>
            {task.prioridade}
          </Badge>
        </div>
        {task.data_vencimento && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(task.data_vencimento), "HH:mm", { locale: ptBR })}
          </div>
        )}
      </div>
      {showOverdue && (
        <AlertCircle className="h-4 w-4 text-danger shrink-0" />
      )}
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Minhas Tarefas
          </CardTitle>
          <Button size="sm" variant="outline" onClick={createQuickTask}>
            <Plus className="h-4 w-4 mr-1" />
            Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4 text-sm text-muted-foreground">
          Total: {pendingTasks.length} tarefas pendentes
        </div>

        {/* Tarefas Atrasadas */}
        {overdueTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-danger flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Atrasadas ({overdueTasks.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {overdueTasks.map(task => (
                <TaskItem key={task.id} task={task} showOverdue />
              ))}
            </div>
          </div>
        )}

        {/* Tarefas de Hoje */}
        {todayTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Hoje ({todayTasks.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {todayTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Tarefas Prioritárias */}
        {priorityTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-warning">
              Prioridade Alta ({priorityTasks.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {priorityTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Próximas Tarefas */}
        {upcomingTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Próximas ({upcomingTasks.length})
            </h4>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {upcomingTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Outras Tarefas */}
        {otherTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Outras ({otherTasks.length})
            </h4>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {otherTasks.map(task => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {pendingTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>Nenhuma tarefa pendente</p>
            <p className="text-sm">Você está em dia!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}