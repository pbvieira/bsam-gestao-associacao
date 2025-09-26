import { useCalendar } from "@/hooks/use-calendar";
import { useQuickActions } from "@/hooks/use-quick-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Plus, Users } from "lucide-react";
import { format, isToday, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export function TodayEvents() {
  const { events } = useCalendar();
  const { createQuickEvent } = useQuickActions();

  const today = new Date();
  const todayEvents = events.filter(event => {
    const eventStart = new Date(event.data_inicio);
    return isToday(eventStart);
  }).sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

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
      case 'reuniao': return 'bg-primary text-primary-foreground';
      case 'evento': return 'bg-accent text-accent-foreground';
      case 'tarefa': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const EventItem = ({ event, showDate = false }: { event: any; showDate?: boolean }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Minha Agenda
          </CardTitle>
          <Button size="sm" variant="outline" onClick={createQuickEvent}>
            <Plus className="h-4 w-4 mr-1" />
            Agendar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Eventos de Hoje */}
        {todayEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">
              Hoje ({todayEvents.length})
            </h4>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {todayEvents.map(event => (
                <EventItem key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Próximos Eventos */}
        {upcomingEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Próximos
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {upcomingEvents.map(event => (
                <EventItem key={event.id} event={event} showDate />
              ))}
            </div>
          </div>
        )}

        {todayEvents.length === 0 && upcomingEvents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>Nenhum compromisso hoje</p>
            <p className="text-sm">Sua agenda está livre!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}