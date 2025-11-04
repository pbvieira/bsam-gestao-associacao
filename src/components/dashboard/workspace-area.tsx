import { useState } from "react";
import { useCalendar } from "@/hooks/use-calendar";
import { useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isPast } from "date-fns";
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

type TimeFilter = 'day' | 'week' | 'month';

export function WorkspaceArea() {
  const { events } = useCalendar();
  const { tasks } = useTasks();
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');

  const today = new Date();

  const getFilteredEvents = () => {
    let startDate: Date;
    let endDate: Date;

    switch (timeFilter) {
      case 'day':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'week':
        startDate = startOfWeek(today, { locale: ptBR });
        endDate = endOfWeek(today, { locale: ptBR });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }

    return events
      .filter(event => {
        const eventStart = new Date(event.data_inicio);
        return isWithinInterval(eventStart, { start: startDate, end: endDate });
      })
      .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  };

  const getFilteredTasks = () => {
    if (!user) return [];

    let startDate: Date;
    let endDate: Date;

    switch (timeFilter) {
      case 'day':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'week':
        startDate = startOfWeek(today, { locale: ptBR });
        endDate = endOfWeek(today, { locale: ptBR });
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }

    return tasks
      .filter(task => {
        if (task.assigned_to !== user.id) return false;
        if (task.status === 'realizada') return false;
        
        if (!task.data_vencimento) return true;
        
        const dueDate = new Date(task.data_vencimento);
        return isWithinInterval(dueDate, { start: startDate, end: endDate });
      })
      .sort((a, b) => {
        const priorityOrder = { 'alta': 0, 'media': 1, 'baixa': 2 };
        const aPriority = priorityOrder[a.prioridade as keyof typeof priorityOrder] || 3;
        const bPriority = priorityOrder[b.prioridade as keyof typeof priorityOrder] || 3;
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        if (!a.data_vencimento && !b.data_vencimento) return 0;
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
      });
  };

  const filteredEvents = getFilteredEvents();
  const filteredTasks = getFilteredTasks();

  const handleTaskComplete = async (task: any) => {
    try {
      const newStatus = task.status === 'realizada' ? 'pendente' : 'realizada';
      
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (error) throw error;

      toast.success(newStatus === 'realizada' ? 'Tarefa concluída!' : 'Tarefa reaberta!');
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'reuniao':
        return 'bg-primary/90 text-white border-primary shadow-sm';
      case 'evento':
        return 'bg-accent/90 text-white border-accent shadow-sm';
      case 'tarefa':
        return 'bg-warning/90 text-white border-warning shadow-sm';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'media':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'baixa':
        return 'bg-primary/10 text-primary border-primary/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

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

  const EventItem = ({ event, showDate = false }: { event: any; showDate?: boolean }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-accent">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium truncate">{event.titulo}</p>
          <Badge className={getEventTypeColor(event.tipo)}>
            {event.tipo}
          </Badge>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {showDate ? (
              <span>
                {format(new Date(event.data_inicio), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            ) : (
              <span>
                {format(new Date(event.data_inicio), "HH:mm", { locale: ptBR })}
                {event.data_fim && ` - ${format(new Date(event.data_fim), "HH:mm", { locale: ptBR })}`}
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
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.descricao}
          </p>
        )}
      </div>
    </div>
  );

  const TaskItem = ({ task }: { task: any }) => {
    const isOverdue = task.data_vencimento && isPast(new Date(task.data_vencimento)) && task.status !== 'realizada';
    
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${
        isOverdue ? 'border-l-destructive' : 'border-l-primary'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{task.titulo}</p>
            <Badge className={getPriorityColor(task.prioridade)}>
              {task.prioridade}
            </Badge>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            {task.data_vencimento && (
              <div className="flex items-center gap-1">
                {isOverdue ? (
                  <AlertCircle className="h-3 w-3 text-destructive" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {format(new Date(task.data_vencimento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  {isOverdue && ' (Atrasada)'}
                </span>
              </div>
            )}
          </div>
          
          {task.descricao && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.descricao}
            </p>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="shrink-0 gap-1 text-xs"
            >
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
              <AlertDialogAction onClick={() => handleTaskComplete(task)}>
                Concluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Minha Área de Trabalho
          </CardTitle>
        </div>
        <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
          <TabsList className="w-full border-b border-border rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="month" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2"
            >
              Mês
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2"
            >
              Semana
            </TabsTrigger>
            <TabsTrigger 
              value="day" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2"
            >
              Dia
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Compromissos */}
          {filteredEvents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Compromissos ({filteredEvents.length})
              </h4>
              <div className="space-y-2">
                {filteredEvents.map(event => (
                  <EventItem 
                    key={event.id} 
                    event={event} 
                    showDate={timeFilter !== 'day'} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tarefas */}
          {filteredTasks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Tarefas ({filteredTasks.length})
              </h4>
              <div className="space-y-2">
                {filteredTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {filteredEvents.length === 0 && filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
              <p className="font-medium">Nenhum compromisso ou tarefa</p>
              <p className="text-sm">Sua área de trabalho está livre neste período!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
