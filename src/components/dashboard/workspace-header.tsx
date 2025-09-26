import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useCalendar } from "@/hooks/use-calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Target, Calendar } from "lucide-react";

export function WorkspaceHeader() {
  const { profile } = useAuth();
  const { tasks } = useTasks();
  const { events } = useCalendar();

  const today = new Date();
  const pendingTasks = tasks.filter(task => task.status === 'pendente').length;
  const todayEvents = events.filter(event => {
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
    <Card className="bg-gradient-primary text-white border-0">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Saudação Personalizada */}
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-bold">
              {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
            </h1>
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="h-4 w-4" />
              <span className="text-sm lg:text-base">
                {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Target className="h-3 w-3 mr-1" />
              {pendingTasks} tarefas pendentes
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Calendar className="h-3 w-3 mr-1" />
              {todayEvents} compromissos hoje
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}