import { Link } from 'react-router-dom';
import { Pill, Stethoscope, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardHealthSummary, TimeFilter } from '@/hooks/use-dashboard-health-summary';
import { cn } from '@/lib/utils';

interface HealthSummaryCardsProps {
  timeFilter: TimeFilter;
}

export function HealthSummaryCards({ timeFilter }: HealthSummaryCardsProps) {
  const { medications, appointments, isLoading } = useDashboardHealthSummary(timeFilter);

  const getTimeLabel = () => {
    switch (timeFilter) {
      case 'day': return 'Hoje';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mês';
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  // Don't show if there's nothing scheduled
  const hasMedications = medications.total > 0;
  const hasAppointments = appointments.total > 0;

  if (!hasMedications && !hasAppointments) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Medications Card */}
      {hasMedications && (
        <Card className={cn(
          "transition-colors",
          medications.pendentes === 0 && medications.naoAdministrados === 0 
            ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" 
            : medications.naoAdministrados > 0
              ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
              : ""
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  medications.pendentes === 0 && medications.naoAdministrados === 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-primary/10"
                )}>
                  <Pill className={cn(
                    "h-4 w-4",
                    medications.pendentes === 0 && medications.naoAdministrados === 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-primary"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Medicamentos</p>
                  <p className="text-xs text-muted-foreground">{getTimeLabel()}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {medications.total} agendados
              </Badge>
            </div>
            
            <div className="mt-3 flex items-center gap-3 text-xs">
              {medications.administrados > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {medications.administrados} admin.
                </span>
              )}
              {medications.pendentes > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  {medications.pendentes} pend.
                </span>
              )}
              {medications.naoAdministrados > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="h-3 w-3" />
                  {medications.naoAdministrados} não admin.
                </span>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/medicacoes">
                  Ver detalhes
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments Card */}
      {hasAppointments && (
        <Card className={cn(
          "transition-colors",
          appointments.pendentes === 0 && appointments.naoRealizados === 0 
            ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" 
            : appointments.naoRealizados > 0
              ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
              : ""
        )}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-lg",
                  appointments.pendentes === 0 && appointments.naoRealizados === 0
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-primary/10"
                )}>
                  <Stethoscope className={cn(
                    "h-4 w-4",
                    appointments.pendentes === 0 && appointments.naoRealizados === 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-primary"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Consultas</p>
                  <p className="text-xs text-muted-foreground">{getTimeLabel()}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {appointments.total} agendadas
              </Badge>
            </div>
            
            <div className="mt-3 flex items-center gap-3 text-xs">
              {appointments.realizados > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  {appointments.realizados} realiz.
                </span>
              )}
              {appointments.pendentes > 0 && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  {appointments.pendentes} pend.
                </span>
              )}
              {appointments.naoRealizados > 0 && (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <XCircle className="h-3 w-3" />
                  {appointments.naoRealizados} não realiz.
                </span>
              )}
            </div>

            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/consultas">
                  Ver detalhes
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
