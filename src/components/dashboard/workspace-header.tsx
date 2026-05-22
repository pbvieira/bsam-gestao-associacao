import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useCalendar } from "@/hooks/use-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Target, Calendar, AlertCircle } from "lucide-react";
import { isPast } from "date-fns";

export function WorkspaceHeader() {
  const { profile, user } = useAuth();
  const { tasks } = useTasks();
  const { events } = useCalendar();

  const today = new Date();
  const myTasks = tasks.filter(
    (t) => user && (t.assigned_to === user.id || t.created_by === user.id)
  );
  const pendingTasks = myTasks.filter((t) => t.status === 'pendente' || t.status === 'em_andamento').length;
  const overdueTasks = myTasks.filter(
    (t) => t.data_vencimento && isPast(new Date(t.data_vencimento)) && t.status !== 'realizada' && t.status !== 'cancelada'
  ).length;
  const todayEvents = events.filter((event) => {
    const eventDate = new Date(event.data_inicio);
    return eventDate.toDateString() === today.toDateString();
  }).length;

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Saudação Personalizada */}
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </span>
              <div className="flex items-center gap-1 ml-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {format(today, "HH:mm")}
                </span>
              </div>
            </div>
          </div>

          {/* Status do Trabalho */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              {pendingTasks} pendentes
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {todayEvents} hoje
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}