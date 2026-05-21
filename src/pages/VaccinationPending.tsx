import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useVaccinationQueue, type VaccinationQueueItem } from '@/hooks/use-vaccination-queue';
import { useVaccinationTrips, type VaccinationTrip } from '@/hooks/use-vaccination-trips';
import { ScheduleVaccinationTripDialog } from '@/components/vaccination/schedule-vaccination-trip-dialog';
import { CompleteVaccinationTripDialog } from '@/components/vaccination/complete-vaccination-trip-dialog';
import { Syringe, Calendar, CheckCircle2, X, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VaccinationPending() {
  const { items, loading, removeFromQueue } = useVaccinationQueue();
  const { trips, loading: loadingTrips, cancelTrip } = useVaccinationTrips();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleVaccine, setScheduleVaccine] = useState<{ id: string; nome: string; items: VaccinationQueueItem[] } | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeTrip, setCompleteTripState] = useState<VaccinationTrip | null>(null);

  const pendingItems = items.filter(i => i.status === 'pendente' && !i.trip_id);
  const grouped = useMemo(() => {
    const g: Record<string, { id: string; nome: string; cor: string; items: VaccinationQueueItem[] }> = {};
    pendingItems.forEach(it => {
      const v = it.vaccine_type;
      if (!v) return;
      if (!g[v.id]) g[v.id] = { id: v.id, nome: v.nome, cor: v.cor, items: [] };
      g[v.id].items.push(it);
    });
    return Object.values(g).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pendingItems]);

  const activeTrips = trips.filter(t => t.status === 'agendada');

  return (
    <MainLayout>
      <PageLayout
        title="Vacinação Pendente"
        subtitle="Alunos aguardando vacinação e idas ao posto agendadas"
      >
        <div className="space-y-6">
          {/* Trips agendadas */}
          {activeTrips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Idas ao posto agendadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeTrips.map(trip => (
                  <div key={trip.id} className="border rounded-md p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: trip.vaccine_type?.cor }} />
                          <span className="font-medium">{trip.vaccine_type?.nome}</span>
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            {trip.queue_items?.length || 0} aluno(s)
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {trip.data_prevista
                            ? `Previsto para ${format(new Date(trip.data_prevista), "dd 'de' MMM yyyy", { locale: ptBR })}`
                            : 'Sem data prevista'}
                          {trip.setor?.nome && ` · Setor: ${trip.setor.nome}`}
                          {trip.responsavel?.full_name && ` · Resp: ${trip.responsavel.full_name}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setCompleteTripState(trip); setCompleteOpen(true); }}>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Registrar vacinação
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost"><X className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Os alunos voltarão à fila de pendentes e a tarefa será cancelada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelTrip(trip.id)}>Cancelar agendamento</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(trip.queue_items || []).map(q => q.student?.nome_completo).filter(Boolean).join(', ')}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Pendentes agrupados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5" />
                Fila de vacinação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(loading || loadingTrips) && (
                <div className="flex items-center gap-2 text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              )}
              {!loading && grouped.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum aluno aguardando vacinação no momento.
                </p>
              )}
              <div className="space-y-4">
                {grouped.map(group => (
                  <div key={group.id} className="border rounded-md">
                    <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.cor }} />
                        <span className="font-medium">{group.nome}</span>
                        <Badge variant="secondary">{group.items.length} aguardando</Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { setScheduleVaccine({ id: group.id, nome: group.nome, items: group.items }); setScheduleOpen(true); }}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Agendar ida ao posto
                      </Button>
                    </div>
                    <div className="divide-y">
                      {group.items.map(it => (
                        <div key={it.id} className="flex items-center justify-between px-3 py-2">
                          <div className="flex-1">
                            <span className="text-sm">{it.student?.nome_completo}</span>
                            <span className="text-xs text-muted-foreground ml-2">{it.student?.codigo_cadastro}</span>
                          </div>
                          <span className="text-xs text-muted-foreground mr-3">
                            Desde {format(new Date(it.created_at), 'dd/MM/yyyy')}
                          </span>
                          <Button size="sm" variant="ghost" onClick={() => removeFromQueue(it.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {scheduleVaccine && (
          <ScheduleVaccinationTripDialog
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            vaccineTypeId={scheduleVaccine.id}
            vaccineName={scheduleVaccine.nome}
            queueItems={scheduleVaccine.items}
          />
        )}
        <CompleteVaccinationTripDialog
          open={completeOpen}
          onOpenChange={setCompleteOpen}
          trip={completeTrip}
        />
      </PageLayout>
    </MainLayout>
  );
}
