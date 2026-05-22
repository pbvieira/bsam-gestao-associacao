import { useCalendar } from "@/hooks/use-calendar";
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { format, isWithinInterval, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { HealthSummaryCards } from "./health-summary-cards";
import { DashboardFilters } from "./dashboard-filters";
import { useDashboardFilters, PERIOD_LABELS } from "@/hooks/use-dashboard-filters";

export function WorkspaceArea() {
  const { events } = useCalendar();
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { filters, setFilters, range, reset } = useDashboardFilters();

  const today = new Date();

  // Eventos filtrados por período + tipo
  const filteredEvents = filters.types.events
    ? events
        .filter((event) => {
          const eventStart = new Date(event.data_inicio);
          return isWithinInterval(eventStart, { start: range.start, end: range.end });
        })
        .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
    : [];

  // Tarefas filtradas
  const filteredTasks = (() => {
    if (!user || !filters.types.tasks) return [];

    return tasks
      .filter((task) => {
        // Escopo
        if (filters.scope === 'mine') {
          if (task.assigned_to !== user.id && task.created_by !== user.id) return false;
        } else if (filters.scope === 'created') {
          if (task.created_by !== user.id) return false;
        } else if (filters.scope === 'assigned') {
          if (task.assigned_to !== user.id) return false;
        }
        // 'team' = todas

        // Status
        if (task.status === 'realizada' || task.status === 'cancelada' || task.status === 'transferida') return false;
        if (task.status === 'pendente' && !filters.statuses.pendente) return false;
        if (task.status === 'em_andamento' && !filters.statuses.em_andamento) return false;

        // Prioridade
        const p = task.prioridade as string;
        if (p === 'alta' && !filters.priorities.alta) return false;
        if (p === 'media' && !filters.priorities.media) return false;
        if (p === 'baixa' && !filters.priorities.baixa) return false;

        // Data: sem vencimento sempre aparece; atrasadas sempre aparecem; dentro do período
        if (!task.data_vencimento) return true;
        const due = new Date(task.data_vencimento);
        if (isPast(due)) return true;
        return isWithinInterval(due, { start: range.start, end: range.end });
      })
      .sort((a, b) => {
        const aOverdue = a.data_vencimento && isPast(new Date(a.data_vencimento));
        const bOverdue = b.data_vencimento && isPast(new Date(b.data_vencimento));
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const priorityOrder: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
        const ap = priorityOrder[a.prioridade] ?? 3;
        const bp = priorityOrder[b.prioridade] ?? 3;
        if (ap !== bp) return ap - bp;

        if (!a.data_vencimento && !b.data_vencimento) return 0;
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      });
  })();

  const overdueTasks = filteredTasks.filter(
    (t) => t.data_vencimento && isPast(new Date(t.data_vencimento))
  );
  const upcomingTasks = filteredTasks.filter(
    (t) => !t.data_vencimento || !isPast(new Date(t.data_vencimento))
  );

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const diffTime = Math.abs(today.getTime() - due.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleTaskComplete = async (task: any) => {
    try {
      const newStatus = task.status === 'realizada' ? 'pendente' : 'realizada';
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
      if (error) throw error;
      toast.success(newStatus === 'realizada' ? 'Tarefa concluída!' : 'Tarefa reaberta!');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'reuniao': return 'bg-primary/90 text-white border-primary shadow-sm';
      case 'evento': return 'bg-accent/90 text-white border-accent shadow-sm';
      case 'tarefa': return 'bg-warning/90 text-white border-warning shadow-sm';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'media': return 'bg-warning/10 text-warning border-warning/20';
      case 'baixa': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const showDateOnEvents = filters.period !== 'today' && filters.period !== 'tomorrow';

  const EventItem = ({ event }: { event: any }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-accent">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{event.titulo}</p>
          <Badge className={getEventTypeColor(event.tipo)}>{event.tipo}</Badge>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {showDateOnEvents ? (
              <span>{format(new Date(event.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
            ) : (
              <span>
                {format(new Date(event.data_inicio), 'HH:mm', { locale: ptBR })}
                {event.data_fim && ` - ${format(new Date(event.data_fim), 'HH:mm', { locale: ptBR })}`}
              </span>
            )}
          </div>
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        {event.descricao && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.descricao}</p>
        )}
      </div>
    </div>
  );

  const TaskItem = ({ task }: { task: any }) => {
    const isOverdue = task.data_vencimento && isPast(new Date(task.data_vencimento)) && task.status !== 'realizada';
    const daysOverdue = isOverdue ? getDaysOverdue(task.data_vencimento) : 0;
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${
        isOverdue ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="font-medium truncate">{task.titulo}</p>
            <Badge className={getPriorityColor(task.prioridade)}>{task.prioridade}</Badge>
            {isOverdue && <Badge className="bg-destructive text-destructive-foreground">ATRASADA</Badge>}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {task.data_vencimento && (
              <div className="flex items-center gap-1">
                {isOverdue ? <AlertCircle className="h-3 w-3 text-destructive" /> : <Clock className="h-3 w-3" />}
                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {format(new Date(task.data_vencimento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {isOverdue && ` (${daysOverdue} ${daysOverdue === 1 ? 'dia' : 'dias'} de atraso)`}
                </span>
              </div>
            )}
          </div>
          {task.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.descricao}</p>}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-xs">
              <Check className="h-3 w-3" />
              Concluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Concluir tarefa?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja marcar a tarefa "{task.titulo}" como concluída?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleTaskComplete(task)}>Concluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Minha Área de Trabalho
        </CardTitle>
        <DashboardFilters
          filters={filters}
          setFilters={(updater) => setFilters(updater(filters))}
          range={range}
          onReset={reset}
          counts={{
            events: filteredEvents.length,
            tasks: filteredTasks.length,
            overdue: overdueTasks.length,
          }}
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filters.types.health && (
            <HealthSummaryCards range={range} label={PERIOD_LABELS[filters.period]} />
          )}

          {filteredEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Compromissos ({filteredEvents.length})
              </h4>
              <div className="space-y-2">
                {filteredEvents.map((event) => <EventItem key={event.id} event={event} />)}
              </div>
            </div>
          )}

          {overdueTasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Tarefas Atrasadas ({overdueTasks.length})
              </h4>
              <div className="space-y-2">
                {overdueTasks.map((task) => <TaskItem key={task.id} task={task} />)}
              </div>
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Tarefas ({upcomingTasks.length})
              </h4>
              <div className="space-y-2">
                {upcomingTasks.map((task) => <TaskItem key={task.id} task={task} />)}
              </div>
            </div>
          )}

          {filteredEvents.length === 0 && filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-medium">Nada em {PERIOD_LABELS[filters.period].toLowerCase()}</p>
              <p className="text-sm mb-4">Sua área de trabalho está livre neste período!</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters((s) => ({ ...s, period: 'next30' }))}
              >
                Ver próximos 30 dias
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
