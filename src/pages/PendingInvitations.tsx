import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, User, Check, X, CalendarCheck, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/use-notifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface PendingInvitation {
  event_id: string;
  notification_id: string;
  event_title: string;
  event_description: string | null;
  event_start: string;
  event_end: string;
  event_location: string | null;
  event_type: string;
  organizer_name: string;
  created_at: string;
}

export default function PendingInvitations() {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const { respondToEventInvite } = useNotifications();
  const { toast } = useToast();

  const fetchPendingInvitations = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar notificações de convite pendentes
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, reference_id, created_at')
        .eq('user_id', user.id)
        .eq('type', 'calendar_invite')
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;
      if (!notifications || notifications.length === 0) {
        setInvitations([]);
        return;
      }

      // Buscar detalhes dos eventos
      const eventIds = notifications
        .filter(n => n.reference_id)
        .map(n => n.reference_id);

      if (eventIds.length === 0) {
        setInvitations([]);
        return;
      }

      const { data: events, error: eventsError } = await supabase
        .from('calendar_events')
        .select(`
          id,
          titulo,
          descricao,
          data_inicio,
          data_fim,
          location,
          tipo,
          created_by
        `)
        .in('id', eventIds);

      if (eventsError) throw eventsError;

      // Buscar nomes dos organizadores
      const organizerIds = [...new Set(events?.map(e => e.created_by) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', organizerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Montar lista de convites pendentes
      const pendingInvitations: PendingInvitation[] = [];
      for (const notif of notifications) {
        const event = events?.find(e => e.id === notif.reference_id);
        if (event) {
          pendingInvitations.push({
            event_id: event.id,
            notification_id: notif.id,
            event_title: event.titulo,
            event_description: event.descricao,
            event_start: event.data_inicio,
            event_end: event.data_fim,
            event_location: event.location,
            event_type: event.tipo,
            organizer_name: profileMap.get(event.created_by) || 'Organizador',
            created_at: notif.created_at,
          });
        }
      }

      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Erro ao buscar convites:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os convites pendentes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();
  }, []);

  const handleRespond = async (eventId: string, response: 'aceito' | 'recusado') => {
    try {
      setRespondingTo(eventId);
      await respondToEventInvite(eventId, response);
      // Remover da lista local
      setInvitations(prev => prev.filter(inv => inv.event_id !== eventId));
    } catch (error) {
      console.error('Erro ao responder convite:', error);
    } finally {
      setRespondingTo(null);
    }
  };

  const formatEventDate = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

    if (isSameDay) {
      return `${format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • ${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
    }
    return `${format(startDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} até ${format(endDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
  };

  const getEventTypeBadge = (type: string) => {
    const types: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      evento: { label: 'Evento', variant: 'default' },
      reuniao: { label: 'Reunião', variant: 'secondary' },
      lembrete: { label: 'Lembrete', variant: 'outline' },
      tarefa: { label: 'Tarefa', variant: 'outline' },
    };
    const config = types[type] || types.evento;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              Convites Pendentes
            </h1>
            <p className="text-muted-foreground">
              Gerencie os convites de eventos que você recebeu
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {invitations.length} {invitations.length === 1 ? 'convite' : 'convites'}
          </Badge>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Nenhum convite pendente</h3>
              <p className="text-muted-foreground text-center max-w-sm mt-1">
                Você não tem convites de eventos aguardando resposta no momento.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invitations.map((invitation) => (
              <Card key={invitation.event_id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {invitation.event_title}
                    </CardTitle>
                    {getEventTypeBadge(invitation.event_type)}
                  </div>
                  <CardDescription className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Organizado por {invitation.organizer_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {invitation.event_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {invitation.event_description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {formatEventDate(invitation.event_start, invitation.event_end)}
                      </span>
                    </div>
                    
                    {invitation.event_location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{invitation.event_location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>
                        Recebido {format(new Date(invitation.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRespond(invitation.event_id, 'aceito')}
                      disabled={respondingTo === invitation.event_id}
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleRespond(invitation.event_id, 'recusado')}
                      disabled={respondingTo === invitation.event_id}
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Recusar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
