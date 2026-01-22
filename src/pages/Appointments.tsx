import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, RefreshCw, Stethoscope, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useMedicalAppointments, MedicalAppointment } from '@/hooks/use-medical-appointments';
import { AppointmentGroup } from '@/components/appointments/AppointmentGroup';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'complete' | 'not-complete'>('complete');
  const [selectedItem, setSelectedItem] = useState<MedicalAppointment | null>(null);

  const { 
    groupedAppointments, 
    loading, 
    stats, 
    fetchAppointments,
    markAsCompleted,
    markAsNotCompleted,
    undoAppointment,
  } = useMedicalAppointments(selectedDate);

  const handleComplete = (item: MedicalAppointment) => {
    setSelectedItem(item);
    setDialogMode('complete');
    setDialogOpen(true);
  };

  const handleNotComplete = (item: MedicalAppointment) => {
    setSelectedItem(item);
    setDialogMode('not-complete');
    setDialogOpen(true);
  };

  const handleUndo = async (item: MedicalAppointment) => {
    await undoAppointment(item);
  };

  const handleConfirmComplete = async (observacoes?: string) => {
    if (selectedItem) {
      await markAsCompleted(selectedItem, observacoes);
    }
  };

  const handleConfirmNotComplete = async (motivo: string, observacoes?: string) => {
    if (selectedItem) {
      await markAsNotCompleted(selectedItem, motivo, observacoes);
    }
  };

  // Filter groups based on status
  const filteredGroups = groupedAppointments.map(group => {
    if (statusFilter === 'todos') return group;
    
    const filteredItems = group.items.filter(item => {
      if (statusFilter === 'realizados') return item.realizado && !item.nao_realizado_motivo;
      if (statusFilter === 'pendentes') return !item.log_id;
      if (statusFilter === 'nao_realizados') return item.nao_realizado_motivo;
      return true;
    });

    return {
      ...group,
      items: filteredItems,
      total: filteredItems.length,
      realizados: filteredItems.filter(i => i.realizado && !i.nao_realizado_motivo).length,
    };
  }).filter(group => group.items.length > 0);

  return (
    <MainLayout>
      <PageLayout
        title="Consultas e Exames"
        subtitle="Gerencie os atendimentos médicos agendados"
      >
        {/* Header with filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendentes">Pendentes</SelectItem>
            <SelectItem value="realizados">Realizados</SelectItem>
            <SelectItem value="nao_realizados">Não realizados</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={() => fetchAppointments()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.realizados}</p>
                <p className="text-sm text-muted-foreground">Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.naoRealizados}</p>
                <p className="text-sm text-muted-foreground">Não realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment groups */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-16 bg-muted rounded" />
                  <div className="h-16 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="space-y-4">
          {filteredGroups.map(group => (
            <AppointmentGroup
              key={group.grupo}
              group={group}
              onComplete={handleComplete}
              onNotComplete={handleNotComplete}
              onUndo={handleUndo}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum atendimento agendado</h3>
            <p className="text-muted-foreground">
              {statusFilter !== 'todos' 
                ? 'Não há atendimentos com o status selecionado para esta data.'
                : 'Não há consultas ou exames agendados para esta data.'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Os atendimentos aparecem aqui quando cadastrados na aba Saúde do aluno com data futura ou data de retorno.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialog */}
      <AppointmentDialog
        item={selectedItem}
        mode={dialogMode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirmComplete={handleConfirmComplete}
        onConfirmNotComplete={handleConfirmNotComplete}
      />
      </PageLayout>
    </MainLayout>
  );
}
