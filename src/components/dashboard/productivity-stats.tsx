import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Clock, Award } from "lucide-react";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export function ProductivityStats() {
  const { tasks } = useTasks();
  const { profile } = useAuth();

  const myTasks = tasks.filter(task => 
    task.assigned_to === profile?.user_id || task.created_by === profile?.user_id
  );

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const weekTasks = myTasks.filter(task => {
    if (!task.created_at) return false;
    const taskDate = new Date(task.created_at);
    return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
  });

  const completedThisWeek = weekTasks.filter(task => task.status === 'realizada').length;
  const totalThisWeek = weekTasks.length;
  const weeklyProgress = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;

  const allCompletedTasks = myTasks.filter(task => task.status === 'realizada');
  const totalHoursSpent = allCompletedTasks.reduce((total, task) => {
    return total + (task.actual_hours || 0);
  }, 0);

  const averageHoursPerTask = allCompletedTasks.length > 0 
    ? totalHoursSpent / allCompletedTasks.length 
    : 0;

  const highPriorityCompleted = allCompletedTasks.filter(
    task => task.prioridade === 'alta'
  ).length;

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-success";
    if (progress >= 60) return "bg-warning";
    return "bg-primary";
  };

  const getPerformanceBadge = () => {
    if (weeklyProgress >= 90) return { text: "Excelente", variant: "default", color: "bg-success" };
    if (weeklyProgress >= 70) return { text: "Muito Bom", variant: "secondary", color: "bg-primary" };
    if (weeklyProgress >= 50) return { text: "Bom", variant: "outline", color: "bg-warning" };
    return { text: "Pode Melhorar", variant: "destructive", color: "bg-muted" };
  };

  const performanceBadge = getPerformanceBadge();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Minha Produtividade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Semanal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Meta Semanal</span>
            <Badge className={performanceBadge.color}>
              {performanceBadge.text}
            </Badge>
          </div>
          <Progress 
            value={weeklyProgress} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedThisWeek} de {totalThisWeek} tarefas</span>
            <span>{Math.round(weeklyProgress)}%</span>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Concluídas</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {allCompletedTasks.length}
            </p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Award className="h-3 w-3" />
              <span>Alta Prioridade</span>
            </div>
            <p className="text-2xl font-bold text-warning">
              {highPriorityCompleted}
            </p>
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Tempo médio por tarefa</span>
            </div>
            <span className="text-sm font-medium">
              {averageHoursPerTask > 0 ? `${averageHoursPerTask.toFixed(1)}h` : '-'}
            </span>
          </div>
        </div>

        {/* Resumo da Semana */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Esta semana:</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Tarefas criadas</span>
              <span className="font-medium">{weekTasks.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Tarefas finalizadas</span>
              <span className="font-medium text-success">{completedThisWeek}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Em andamento</span>
              <span className="font-medium text-warning">
                {weekTasks.filter(t => t.status === 'em_andamento').length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}