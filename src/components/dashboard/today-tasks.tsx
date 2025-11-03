import { useState } from "react";
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { useQuickActions } from "@/hooks/use-quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckSquare, Clock, AlertCircle, Plus } from "lucide-react";
import { format, isToday, isPast, startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Task } from "@/hooks/use-tasks";
type TimeFilter = 'day' | 'week' | 'month';
export function TodayTasks() {
  const {
    tasks,
    updateTask
  } = useTasks();
  const {
    profile
  } = useAuth();
  const {
    createQuickTask
  } = useQuickActions();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('day');
  const today = new Date();

  // Filtrar apenas tarefas do usuário atual
  const userTasks = tasks.filter(task => task.assigned_to === profile?.user_id || task.created_by === profile?.user_id);

  // Filtrar tarefas ativas (pendentes e em andamento)
  const pendingTasks = userTasks.filter(task => task.status === "pendente" || task.status === "em_andamento");
  const getFilteredTasks = () => {
    let startDate: Date;
    let endDate: Date;
    switch (timeFilter) {
      case 'day':
        startDate = startOfDay(today);
        endDate = startOfDay(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = startOfWeek(today, {
          locale: ptBR
        });
        endDate = endOfWeek(today, {
          locale: ptBR
        });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }
    return pendingTasks.filter(task => {
      // Para tarefas sem data de vencimento, usar data de criação
      if (!task.data_vencimento) {
        const createdDate = new Date(task.created_at);
        return isWithinInterval(createdDate, {
          start: startDate,
          end: endDate
        });
      }

      // Para tarefas com data de vencimento, usar normalmente
      const dueDate = new Date(task.data_vencimento);
      return isWithinInterval(dueDate, {
        start: startDate,
        end: endDate
      });
    }).sort((a, b) => {
      // Ordenar por prioridade e data
      const priorityOrder = {
        alta: 0,
        media: 1,
        baixa: 2
      };
      const priorityDiff = priorityOrder[a.prioridade] - priorityOrder[b.prioridade];
      if (priorityDiff !== 0) return priorityDiff;

      // Tarefas sem data vão para o final
      if (!a.data_vencimento) return 1;
      if (!b.data_vencimento) return -1;
      return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
    });
  };
  const filteredTasks = getFilteredTasks();
  const handleTaskComplete = async (task: Task) => {
    await updateTask(task.id, {
      status: task.status === 'realizada' ? 'pendente' : 'realizada',
      data_conclusao: task.status === 'realizada' ? null : new Date().toISOString()
    });
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-destructive/80 text-white border-destructive shadow-sm';
      case 'media':
        return 'bg-warning/80 text-white border-warning shadow-sm';
      case 'baixa':
        return 'bg-success/80 text-white border-success shadow-sm';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const TaskItem = ({
    task,
    showOverdue = false
  }: {
    task: Task;
    showOverdue?: boolean;
  }) => <div className={`flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm hover:shadow-md transition-all duration-200 ${showOverdue ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-primary'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className={`font-medium truncate ${task.status === 'realizada' ? 'line-through text-muted-foreground' : ''}`}>
            {task.titulo}
          </p>
          <Badge className={getPriorityColor(task.prioridade)}>
            {task.prioridade}
          </Badge>
          {showOverdue && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
        </div>
        {task.data_vencimento && <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {format(new Date(task.data_vencimento), "dd/MM 'às' HH:mm", {
          locale: ptBR
        })}
          </div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">Concluir</span>
        <Checkbox checked={task.status === 'realizada'} onCheckedChange={() => handleTaskComplete(task)} />
      </div>
    </div>;
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'day':
        return 'Hoje';
      case 'week':
        return 'Esta Semana';
      case 'month':
        return 'Este Mês';
    }
  };
  return <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Minhas Tarefas
          </CardTitle>
        </div>
        <Tabs value={timeFilter} onValueChange={value => setTimeFilter(value as TimeFilter)}>
          <TabsList className="w-full border-b border-border rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger value="month" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2">
              Mês
            </TabsTrigger>
            <TabsTrigger value="week" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2">
              Semana
            </TabsTrigger>
            <TabsTrigger value="day" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2">
              Dia
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {/* Tarefas Filtradas */}
            {filteredTasks.length > 0 && <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  {getTimeFilterLabel()} ({filteredTasks.length})
                </h4>
                <div className="space-y-2">
                  {filteredTasks.map(task => {
                const isOverdue = task.data_vencimento && isPast(new Date(task.data_vencimento)) && !isToday(new Date(task.data_vencimento));
                return <TaskItem key={task.id} task={task} showOverdue={isOverdue} />;
              })}
                </div>
              </div>}

            {filteredTasks.length === 0 && <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>Nenhuma tarefa neste período</p>
                <p className="text-sm">Você está em dia!</p>
              </div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>;
}