import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { useMedicationAdministration, MedicationAdministration } from '@/hooks/use-medication-administration';
import { MedicationTimeGroup } from '@/components/medications/MedicationTimeGroup';
import { AdministrationDialog } from '@/components/medications/AdministrationDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Filter, RefreshCw, Pill, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetores } from '@/hooks/use-setores';
import { DatePeriodSelector, ViewPeriod } from '@/components/ui/date-period-selector';
import { DateGroupHeader } from '@/components/ui/date-group-header';
import { parseISO } from 'date-fns';

type StatusFilter = 'all' | 'pending' | 'administered' | 'not-administered';

export default function Medications() {
  const [date, setDate] = useState<Date>(new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('day');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [setorFilter, setSetorFilter] = useState<string>('all');
  
  const { 
    groupedMedications, 
    dateGroupedMedications,
    medications, 
    loading, 
    refetch, 
    markAsAdministered, 
    markAsNotAdministered, 
    undoAdministration 
  } = useMedicationAdministration(date, viewPeriod);
  const { setores } = useSetores();

  // Dialog state
  const [dialogItem, setDialogItem] = useState<MedicationAdministration | null>(null);
  const [dialogMode, setDialogMode] = useState<'administer' | 'not-administer'>('administer');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filter medications by status and setor
  const filterItems = (items: MedicationAdministration[]) => {
    let filtered = items;

    // Status filter
    if (statusFilter === 'pending') {
      filtered = filtered.filter(item => !item.administrado && !item.nao_administrado_motivo);
    } else if (statusFilter === 'administered') {
      filtered = filtered.filter(item => item.administrado);
    } else if (statusFilter === 'not-administered') {
      filtered = filtered.filter(item => item.nao_administrado_motivo);
    }

    // Setor filter
    if (setorFilter !== 'all') {
      filtered = filtered.filter(item => item.setor_responsavel_id === setorFilter);
    }

    return filtered;
  };

  // Filter for day view
  const filteredGroups = groupedMedications.map(group => {
    const filteredItems = filterItems(group.items);
    return {
      ...group,
      items: filteredItems,
      total: filteredItems.length,
      administrados: filteredItems.filter(i => i.administrado).length
    };
  }).filter(group => group.items.length > 0);

  // Filter for week/month view
  const filteredDateGroups = dateGroupedMedications.map(dateGroup => {
    const filteredGroupsForDate = dateGroup.groups.map(group => {
      const filteredItems = filterItems(group.items);
      return {
        ...group,
        items: filteredItems,
        total: filteredItems.length,
        administrados: filteredItems.filter(i => i.administrado).length
      };
    }).filter(group => group.items.length > 0);

    const total = filteredGroupsForDate.reduce((sum, g) => sum + g.total, 0);
    const administrados = filteredGroupsForDate.reduce((sum, g) => sum + g.administrados, 0);

    return {
      ...dateGroup,
      groups: filteredGroupsForDate,
      total,
      administrados
    };
  }).filter(dateGroup => dateGroup.groups.length > 0);

  // Stats
  const filteredMedications = filterItems(medications);
  const totalMedications = filteredMedications.length;
  const administeredCount = filteredMedications.filter(m => m.administrado).length;
  const pendingCount = filteredMedications.filter(m => !m.administrado && !m.nao_administrado_motivo).length;
  const notAdministeredCount = filteredMedications.filter(m => m.nao_administrado_motivo).length;

  const handleAdminister = (item: MedicationAdministration) => {
    setDialogItem(item);
    setDialogMode('administer');
    setDialogOpen(true);
  };

  const handleNotAdminister = (item: MedicationAdministration) => {
    setDialogItem(item);
    setDialogMode('not-administer');
    setDialogOpen(true);
  };

  const handleConfirmAdminister = async (observacoes?: string) => {
    if (!dialogItem) return;
    await markAsAdministered(dialogItem, observacoes);
  };

  const handleConfirmNotAdminister = async (motivo: string, observacoes?: string) => {
    if (!dialogItem) return;
    await markAsNotAdministered(dialogItem, motivo, observacoes);
  };

  return (
    <MainLayout>
      <PageLayout title="Administração de Medicamentos" subtitle="Gerencie a administração de medicamentos aos alunos">
      <div className="space-y-6">
        {/* Header with filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Date Period Selector */}
            <DatePeriodSelector
              date={date}
              onDateChange={setDate}
              viewPeriod={viewPeriod}
              onViewPeriodChange={setViewPeriod}
            />

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="administered">Administrados</SelectItem>
                <SelectItem value="not-administered">Não administrados</SelectItem>
              </SelectContent>
            </Select>

            {/* Setor Filter */}
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Setor responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {setores.map((setor) => (
                  <SelectItem key={setor.id} value={setor.id}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMedications}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{administeredCount}</p>
                <p className="text-xs text-muted-foreground">Administrados</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{notAdministeredCount}</p>
                <p className="text-xs text-muted-foreground">Não admin.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medication Groups */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewPeriod === 'day' ? (
          // Day view - show time groups directly
          filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum medicamento encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {medications.length === 0
                    ? 'Não há medicamentos agendados para esta data.'
                    : 'Nenhum medicamento corresponde aos filtros selecionados.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div>
              {filteredGroups.map((group) => (
                <MedicationTimeGroup
                  key={group.horario}
                  group={group}
                  onAdminister={handleAdminister}
                  onNotAdminister={handleNotAdminister}
                  onUndo={undoAdministration}
                />
              ))}
            </div>
          )
        ) : (
          // Week/Month view - show date headers with time groups
          filteredDateGroups.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum medicamento encontrado</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {medications.length === 0
                    ? `Não há medicamentos agendados para ${viewPeriod === 'week' ? 'esta semana' : 'este mês'}.`
                    : 'Nenhum medicamento corresponde aos filtros selecionados.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredDateGroups.map((dateGroup) => (
                <div key={dateGroup.date.toISOString()}>
                  <DateGroupHeader
                    date={dateGroup.date}
                    itemCount={dateGroup.total}
                    pendingCount={dateGroup.total - dateGroup.administrados}
                  />
                  <div className="ml-4">
                    {dateGroup.groups.map((group) => (
                      <MedicationTimeGroup
                        key={`${dateGroup.date.toISOString()}-${group.horario}`}
                        group={group}
                        onAdminister={handleAdminister}
                        onNotAdminister={handleNotAdminister}
                        onUndo={undoAdministration}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Administration Dialog */}
        <AdministrationDialog
          item={dialogItem}
          mode={dialogMode}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onConfirmAdminister={handleConfirmAdminister}
          onConfirmNotAdminister={handleConfirmNotAdminister}
        />
      </div>
      </PageLayout>
    </MainLayout>
  );
}
