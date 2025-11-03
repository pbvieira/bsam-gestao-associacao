import { useState } from "react";
import { useCalendar } from "@/hooks/use-calendar";
import { useQuickActions } from "@/hooks/use-quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { format, isToday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
type TimeFilter = 'day' | 'week' | 'month';
export function TodayEvents() {
  const {
    events
  } = useCalendar();
  const {
    createQuickEvent
  } = useQuickActions();
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
    return events.filter(event => {
      const eventStart = new Date(event.data_inicio);
      return isWithinInterval(eventStart, {
        start: startDate,
        end: endDate
      });
    }).sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());
  };
  const filteredEvents = getFilteredEvents();
  const todayEvents = events.filter(event => isToday(new Date(event.data_inicio)));
  const upcomingEvents = events.filter(event => {
    const eventStart = new Date(event.data_inicio);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return eventStart >= startOfDay(tomorrow) && eventStart <= endOfDay(nextWeek);
  }).slice(0, 3);
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
  const EventItem = ({
    event,
    showDate = false
  }: {
    event: any;
    showDate?: boolean;
  }) => <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-accent">
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
            {showDate ? <span>
                {format(new Date(event.data_inicio), "dd/MM 'às' HH:mm", {
              locale: ptBR
            })}
              </span> : <span>
                {format(new Date(event.data_inicio), "HH:mm", {
              locale: ptBR
            })}
                {event.data_fim && ` - ${format(new Date(event.data_fim), "HH:mm", {
              locale: ptBR
            })}`}
              </span>}
          </div>
          
          {event.location && <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>}
        </div>
        
        {event.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {event.descricao}
          </p>}
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
            <Calendar className="h-5 w-5 text-primary" />
            Minha Agenda
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
            {/* Eventos Filtrados */}
            {filteredEvents.length > 0 && <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  {getTimeFilterLabel()} ({filteredEvents.length})
                </h4>
                <div className="space-y-2">
                  {filteredEvents.map(event => <EventItem key={event.id} event={event} showDate={timeFilter !== 'day'} />)}
                </div>
              </div>}

            {filteredEvents.length === 0 && <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p>Nenhum compromisso</p>
                <p className="text-sm">Sua agenda está livre neste período!</p>
              </div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>;
}