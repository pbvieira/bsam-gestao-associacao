import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, User, Check, X, History, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface InvitationHistoryItem {
  participant_id: string;
  event_id: string;
  event_title: string;
  event_description: string | null;
  event_start: string;
  event_end: string;
  event_location: string | null;
  event_type: string;
  organizer_name: string;
  status: 'aceito' | 'recusado';
  responded_at: string;
}

export default function InvitationsHistory() {
  const [items, setItems] = useState<InvitationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'aceito' | 'recusado'>('all');
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: parts, error } = await supabase
        .from('event_participants')
        .select(`
          id, event_id, status, created_at,
          calendar_events:calendar_events!event_participants_event_id_fkey(
            id, titulo, descricao, data_inicio, data_fim, location, tipo, created_by
          )
        `)
        .eq('user_id', user.id)
        .eq('is_organizer', false)
        .in('status', ['aceito', 'recusado'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const events = (parts || []).map((p: any) => p.calendar_events).filter(Boolean);
      const organizerIds = [...new Set(events.map((e: any) => e.created_by))];
      const { data: profiles } = await supabase
        .from('profiles').select('user_id, full_name').in('user_id', organizerIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      const list: InvitationHistoryItem[] = (parts || [])
        .filter((p: any) => p.calendar_events)
        .map((p: any) => ({
          participant_id: p.id,
          event_id: p.calendar_events.id,
          event_title: p.calendar_events.titulo,
          event_description: p.calendar_events.descricao,
          event_start: p.calendar_events.data_inicio,
          event_end: p.calendar_events.data_fim,
          event_location: p.calendar_events.location,
          event_type: p.calendar_events.tipo,
          organizer_name: profileMap.get(p.calendar_events.created_by) || 'Organizador',
          status: p.status,
          responded_at: p.created_at,
        }));

      setItems(list);
    } catch (error) {
      console.error('Erro ao buscar histórico de convites:', error);
      toast({ title: "Erro", description: "Não foi possível carregar o histórico", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const channel = supabase
      .channel('invitations-history-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants' }, () => fetchHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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
      atendimento: { label: 'Atendimento', variant: 'secondary' },
      lembrete: { label: 'Lembrete', variant: 'outline' },
    };
    const config = types[type] || types.evento;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: 'aceito' | 'recusado') => {
    if (status === 'aceito') {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700"><Check className="h-3 w-3 mr-1" />Aceito</Badge>;
    }
    return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Recusado</Badge>;
  };

  const filtered = tab === 'all' ? items : items.filter(i => i.status === tab);
  const acceptedCount = items.filter(i => i.status === 'aceito').length;
  const declinedCount = items.filter(i => i.status === 'recusado').length;

  return (
    <MainLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Histórico de Convites
            </h1>
            <p className="text-muted-foreground">Convites que você já respondeu</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Todos ({items.length})</TabsTrigger>
            <TabsTrigger value="aceito">Aceitos ({acceptedCount})</TabsTrigger>
            <TabsTrigger value="recusado">Recusados ({declinedCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum convite encontrado</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    Você ainda não respondeu nenhum convite nesta categoria.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <Card key={item.participant_id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{item.event_title}</CardTitle>
                        {getEventTypeBadge(item.event_type)}
                      </div>
                      <CardDescription className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        Organizado por {item.organizer_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      {item.event_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.event_description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">{formatEventDate(item.event_start, item.event_end)}</span>
                        </div>
                        {item.event_location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="line-clamp-1">{item.event_location}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.responded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
