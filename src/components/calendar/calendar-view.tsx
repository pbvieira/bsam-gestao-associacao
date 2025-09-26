import { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { CalendarEvent } from "@/hooks/use-calendar";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

  // Função para filtrar eventos baseado no modo de visualização
  const getFilteredEvents = () => {
    if (showingSpecificDay) {
      return events.filter(event => isSameDay(new Date(event.data_inicio), selectedDate));
    }

    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return events.filter(event => {
        const eventDate = new Date(event.data_inicio);
        return eventDate >= monthStart && eventDate <= monthEnd;
      });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return events.filter(event => {
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
      const dayEvents = events.filter(event => 
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
            setSelectedDate(new Date(day));
            setShowingSpecificDay(true);
            onDateSelect(new Date(day));
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
                  onEditEvent(event.id);
                }}
              >
                <div className="truncate font-medium">{event.titulo}</div>
                {!event.all_day && (
                  <div className="text-xs opacity-75">
                    {format(new Date(event.data_inicio), "HH:mm")}
                  </div>
                )}
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
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onEditEvent(event.id)}
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
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{event.titulo}</div>
                        {event.location && (
                          <div className="text-sm text-muted-foreground">{event.location}</div>
                        )}
                      </div>
                      <Badge className={cn("border", typeColors[event.tipo])}>
                        {typeLabels[event.tipo]}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});