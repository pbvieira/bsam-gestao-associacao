import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Check, X, History, Inbox, Search, ChevronLeft, ChevronRight } from "lucide-react";
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

const PAGE_SIZE = 9;

type TabValue = 'all' | 'aceito' | 'recusado';

export default function InvitationsHistory() {
  const [items, setItems] = useState<InvitationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabValue>('all');
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState({ all: 0, aceito: 0, recusado: 0 });
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);

  const fetchCounts = useCallback(async (userId: string) => {
    const statuses = ['aceito', 'recusado'] as const;
    const results = await Promise.all(
      statuses.map((s) =>
        supabase
          .from('event_participants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_organizer', false)
          .eq('status', s)
      )
    );
    const aceito = results[0].count || 0;
    const recusado = results[1].count || 0;
    setCounts({ all: aceito + recusado, aceito, recusado });
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('event_participants')
        .select(
          `id, event_id, status, created_at,
           calendar_events:calendar_events!event_participants_event_id_fkey(
             id, titulo, descricao, data_inicio, data_fim, location, tipo, created_by
           )`,
          { count: 'exact' }
        )
        .eq('user_id', user.id)
        .eq('is_organizer', false);

      if (tab === 'all') {
        query = query.in('status', ['aceito', 'recusado']);
      } else {
        query = query.eq('status', tab);
      }

      if (debouncedSearch) {
        query = query.ilike('calendar_events.titulo', `%${debouncedSearch}%`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data: parts, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // When using ilike on a joined table, rows come back with calendar_events = null
      // for non-matching joins. Filter those out client-side.
      const validRows = (parts || []).filter((p: any) => p.calendar_events);

      const organizerIds = [...new Set(validRows.map((p: any) => p.calendar_events.created_by))];
      const { data: profiles } = organizerIds.length
        ? await supabase.from('profiles').select('user_id, full_name').in('user_id', organizerIds)
        : { data: [] as { user_id: string; full_name: string }[] };
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

      const list: InvitationHistoryItem[] = validRows.map((p: any) => ({
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
      setTotalCount(count || 0);
      fetchCounts(user.id);
    } catch (error) {
      console.error('Erro ao buscar histórico de convites:', error);
      toast({ title: "Erro", description: "Não foi possível carregar o histórico", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tab, debouncedSearch, page, fetchCounts, toast]);

  useEffect(() => {
    fetchHistory();
    const channel = supabase
      .channel('invitations-history-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_participants' }, () => fetchHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchHistory]);

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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título do evento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
            <TabsTrigger value="aceito">Aceitos ({counts.aceito})</TabsTrigger>
            <TabsTrigger value="recusado">Recusados ({counts.recusado})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-4">
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
            ) : items.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum convite encontrado</h3>
                  <p className="text-muted-foreground text-center max-w-sm mt-1">
                    {debouncedSearch
                      ? 'Nenhum resultado para sua busca.'
                      : 'Você ainda não respondeu nenhum convite nesta categoria.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
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

                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} • {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages || loading}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
