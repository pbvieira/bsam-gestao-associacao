import { useState } from "react";
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

export function CalendarView({ events, loading, onEditEvent, onDateSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;

  // Gerar dias do calendário
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const dayEvents = events.filter(event => 
        isSameDay(new Date(event.data_inicio), day)
      );

      days.push(
        <div
          key={day.toString()}
          className={cn(
            "min-h-[120px] p-2 border border-border cursor-pointer hover:bg-muted/50 transition-colors",
            !isSameMonth(day, monthStart) && "text-muted-foreground bg-muted/20",
            isToday(day) && "bg-primary/10 border-primary"
          )}
          onClick={() => onDateSelect(new Date(day))}
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
                className="text-xs p-1 rounded bg-primary/10 text-primary-foreground cursor-pointer hover:bg-primary/20 transition-colors"
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
  }

  const typeColors = {
    reuniao: "bg-primary/10 text-primary-foreground border-primary/20",
    atendimento: "bg-success/10 text-success-foreground border-success/20",
    evento: "bg-warning/10 text-warning-foreground border-warning/20",
    lembrete: "bg-accent/10 text-accent-foreground border-accent/20"
  };

  const typeLabels = {
    reuniao: "Reunião",
    atendimento: "Atendimento",
    evento: "Evento",
    lembrete: "Lembrete"
  };

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
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Mês
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
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

      {/* Lista de eventos do dia selecionado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Eventos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.filter(event => isSameDay(new Date(event.data_inicio), new Date())).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum evento para hoje
            </p>
          ) : (
            <div className="space-y-3">
              {events
                .filter(event => isSameDay(new Date(event.data_inicio), new Date()))
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
                      <Badge className={typeColors[event.tipo]}>
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
}