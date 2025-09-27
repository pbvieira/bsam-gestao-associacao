import { CheckSquare, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { Task } from "@/hooks/use-tasks";

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pendente').length;
  const inProgressTasks = tasks.filter(task => task.status === 'em_andamento').length;
  const completedTasks = tasks.filter(task => task.status === 'realizada').length;

  return (
    <StatsGrid>
      <StatsCard
        title="Total de Tarefas"
        value={totalTasks}
        icon={CheckSquare}
        colorClass="text-primary"
      />
      <StatsCard
        title="Pendentes"
        value={pendingTasks}
        icon={Clock}
        colorClass="text-warning"
        description={`${totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}% do total`}
      />
      <StatsCard
        title="Em Andamento"
        value={inProgressTasks}
        icon={AlertTriangle}
        colorClass="text-info"
        description={`${totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}% do total`}
      />
      <StatsCard
        title="Concluídas"
        value={completedTasks}
        icon={CheckCircle}
        colorClass="text-success"
        description={`${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% do total`}
      />
    </StatsGrid>
  );
}