import { useState, forwardRef, useImperativeHandle, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, Repeat } from "lucide-react";
import { CalendarEvent } from "@/hooks/use-calendar";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Tipo estendido para eventos com instâncias recorrentes
interface ExpandedCalendarEvent extends CalendarEvent {
  _isRecurrenceInstance?: boolean;
  _originalEventId?: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  loading: boolean;
  onEditEvent: (eventId: string) => void;
  onDateSelect: (date: Date) => void;
}

export interface CalendarViewRef {
  resetViewState: () => void;
}

export const CalendarView = forwardRef<CalendarViewRef, CalendarViewProps>(({ 
  events, 
  loading, 
  onEditEvent, 
  onDateSelect 
}, ref) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showingSpecificDay, setShowingSpecificDay] = useState(false);

  const resetViewState = () => {
    setShowingSpecificDay(false);
    setSelectedDate(new Date());
    setCurrentDate(new Date());
  };

  useImperativeHandle(ref, () => ({
    resetViewState
  }));

  // Função para expandir eventos recorrentes
  const expandRecurringEvents = (events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): ExpandedCalendarEvent[] => {
    const expandedEvents: ExpandedCalendarEvent[] = [];
    
    events.forEach(event => {
      // Eventos sem recorrência são adicionados diretamente
      if (!event.recurrence_type || event.recurrence_type === 'none') {
        expandedEvents.push(event);
        return;
      }
      
      const eventStart = new Date(event.data_inicio);
      const eventEnd = new Date(event.data_fim);
      const duration = eventEnd.getTime() - eventStart.getTime();
      
      // Definir limite de recorrência
      const recurrenceEnd = event.recurrence_end 
        ? new Date(event.recurrence_end) 
        : addMonths(rangeEnd, 3); // Limite de 3 meses se não definido
      
      let currentDate = new Date(eventStart);
      let instanceCount = 0;
      const maxInstances = 100; // Limite de segurança
      
      while (currentDate <= recurrenceEnd && currentDate <= rangeEnd && instanceCount < maxInstances) {
        // Só adiciona se estiver dentro do range visível
        if (currentDate >= rangeStart || isSameDay(currentDate, eventStart)) {
          const instanceEnd = new Date(currentDate.getTime() + duration);
          
          // A primeira instância é o evento original
          if (isSameDay(currentDate, eventStart)) {
            expandedEvents.push({
              ...event,
              _isRecurrenceInstance: false,
              _originalEventId: event.id
            });
          } else {
            // Criar instância virtual
            expandedEvents.push({
              ...event,
              id: `${event.id}_${format(currentDate, 'yyyy-MM-dd')}`,
              data_inicio: currentDate.toISOString(),
              data_fim: instanceEnd.toISOString(),
              _isRecurrenceInstance: true,
              _originalEventId: event.id
            });
          }
        }
        
        instanceCount++;
        
        // Avançar para próxima ocorrência
        switch (event.recurrence_type) {
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            currentDate = addDays(currentDate, 7);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          default:
            currentDate = addDays(currentDate, 1);
        }
      }
    });
    
    return expandedEvents;
  };

  // Definir cores e labels dos tipos de evento
  const typeColors = {
    reuniao: "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800",
    atendimento: "bg-green-100 text-green-900 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800", 
    evento: "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-800",
    lembrete: "bg-orange-100 text-orange-900 border-orange-200 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-800"
  };

  const typeLabels = {
    reuniao: "Reunião",
    atendimento: "Atendimento",
    evento: "Evento",
    lembrete: "Lembrete"
  };

  // Calcular range de datas visível para expansão de recorrência
  const visibleRangeStart = useMemo(() => {
    if (viewMode === 'week') {
      return startOfWeek(currentDate, { weekStartsOn: 0 });
    }
    return startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  }, [currentDate, viewMode]);

  const visibleRangeEnd = useMemo(() => {
    if (viewMode === 'week') {
      return endOfWeek(currentDate, { weekStartsOn: 0 });
    }
    return endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  }, [currentDate, viewMode]);

  // Expandir eventos recorrentes para o range visível
  const expandedEvents = useMemo(() => {
    return expandRecurringEvents(events, visibleRangeStart, visibleRangeEnd);
  }, [events, visibleRangeStart, visibleRangeEnd]);

  // Função para filtrar eventos baseado no modo de visualização
  const getFilteredEvents = (): ExpandedCalendarEvent[] => {
    if (showingSpecificDay) {
      return expandedEvents.filter(event => isSameDay(new Date(event.data_inicio), selectedDate));
    }

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return expandedEvents.filter(event => {
        const eventDate = new Date(event.data_inicio);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return expandedEvents.filter(event => {
        const eventDate = new Date(event.data_inicio);
        return eventDate >= weekStart && eventDate <= weekEnd;
      });
    }
    
    return [];
  };

  // Função para obter o título da lista de eventos
  const getEventListTitle = () => {
    if (showingSpecificDay) {
      if (isSameDay(selectedDate, new Date())) {
        return 'Eventos de Hoje';
      }
      return `Eventos de ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`;
    }

    if (viewMode === 'month') {
      const filteredEvents = getFilteredEvents();
      return `Eventos do Mês - ${format(currentDate, "MMMM yyyy", { locale: ptBR })} (${filteredEvents.length})`;
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      const filteredEvents = getFilteredEvents();
      return `Eventos da Semana - ${format(weekStart, "dd/MM", { locale: ptBR })} a ${format(weekEnd, "dd/MM", { locale: ptBR })} (${filteredEvents.length})`;
    }

    return 'Eventos';
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  
  const startDate = viewMode === 'week' ? weekStart : startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = viewMode === 'week' ? weekEnd : endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  // Gerar dias do calendário
  while (day <= endDate) {
    const daysInRow = viewMode === 'week' ? 7 : 7;
    for (let i = 0; i < daysInRow; i++) {
      const dayEvents = expandedEvents.filter(event => 
        isSameDay(new Date(event.data_inicio), day)
      );

      days.push(
        <div
          key={day.toString()}
          className={cn(
            "min-h-[120px] p-2 border border-border cursor-pointer hover:bg-muted/50 transition-colors",
            viewMode === 'month' && !isSameMonth(day, monthStart) && "text-muted-foreground bg-muted/20",
            isToday(day) && "bg-primary/10 border-primary",
            isSameDay(day, selectedDate) && "ring-2 ring-primary"
          )}
          onClick={() => {
            // Criar uma nova data local sem problemas de timezone
            const clickedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            setSelectedDate(clickedDate);
            setShowingSpecificDay(true);
            onDateSelect(clickedDate);
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={cn(
              "text-sm font-medium",
              isToday(day) && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
            )}>
              {format(day, dateFormat)}
            </span>
          </div>
          
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs p-1 rounded cursor-pointer transition-colors border",
                  typeColors[event.tipo]
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  // Para instâncias recorrentes, abrir o evento original
                  const eventIdToEdit = (event as ExpandedCalendarEvent)._originalEventId || event.id;
                  onEditEvent(eventIdToEdit);
                }}
              >
                <div className="truncate font-medium flex items-center gap-1">
                  {event.titulo}
                  {event.recurrence_type && event.recurrence_type !== 'none' && (
                    <Repeat className="w-2.5 h-2.5 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs opacity-75">
                  {!event.all_day && (
                    <span>{format(new Date(event.data_inicio), "HH:mm")}</span>
                  )}
                  {event.participants && event.participants.length > 1 && (
                    <span className="flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      {event.participants.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{dayEvents.length - 3} mais
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
    
    // Para visualização semanal, mostrar apenas uma linha
    if (viewMode === 'week') break;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Calendário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-xl font-semibold min-w-[200px] text-center">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDate(new Date());
                  setShowingSpecificDay(true);
                }}
              >
                Hoje
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('month');
                  setShowingSpecificDay(false);
                }}
              >
                Mês
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('week');
                  setShowingSpecificDay(false);
                }}
              >
                Semana
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid do Calendário */}
      <Card>
        <CardContent className="p-0">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="p-4 text-center font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          
          {/* Dias do calendário */}
          <div className="space-y-0">
            {rows}
          </div>
        </CardContent>
      </Card>

      {/* Lista de eventos baseada no modo de visualização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            {getEventListTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getFilteredEvents().length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {showingSpecificDay 
                ? `Nenhum evento para ${isSameDay(selectedDate, new Date()) ? 'hoje' : 'este dia'}` 
                : viewMode === 'month' 
                  ? 'Nenhum evento neste mês'
                  : 'Nenhum evento nesta semana'
              }
            </p>
          ) : (
            <div className="space-y-3">
              {getFilteredEvents()
                .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
                .map((event) => {
                  // Para instâncias recorrentes, abrir o evento original
                  const eventIdToEdit = (event as ExpandedCalendarEvent)._originalEventId || event.id;
                  
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onEditEvent(eventIdToEdit)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {!showingSpecificDay && (
                              <span className="mr-2">{format(new Date(event.data_inicio), "dd/MM", { locale: ptBR })}</span>
                            )}
                            {event.all_day 
                              ? 'Dia todo' 
                              : `${format(new Date(event.data_inicio), "HH:mm")} - ${format(new Date(event.data_fim), "HH:mm")}`
                            }
                          </span>
                          {event.recurrence_type && event.recurrence_type !== 'none' && (
                            <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-medium">{event.titulo}</div>
                          {event.location && (
                            <div className="text-sm text-muted-foreground">{event.location}</div>
                          )}
                          {event.created_by_profile && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                              <Users className="w-3 h-3" />
                              Organizado por: {event.created_by_profile.full_name}
                            </div>
                          )}
                        </div>
                        <Badge className={cn("border", typeColors[event.tipo])}>
                          {typeLabels[event.tipo]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});