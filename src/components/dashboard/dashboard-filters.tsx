import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import {
  DashboardFiltersState,
  PERIOD_LABELS,
  PeriodPreset,
  SCOPE_LABELS,
  ScopeFilter,
} from '@/hooks/use-dashboard-filters';

interface Props {
  filters: DashboardFiltersState;
  setFilters: (updater: (s: DashboardFiltersState) => DashboardFiltersState) => void;
  range: { start: Date; end: Date };
  onReset: () => void;
  counts: { events: number; tasks: number; overdue: number };
}

export function DashboardFilters({ filters, setFilters, range, onReset, counts }: Props) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'administrador' || profile?.role === 'gestor';
  const [customOpen, setCustomOpen] = useState(false);

  const periodOptions: PeriodPreset[] = [
    'today', 'tomorrow', 'next7', 'next30', 'week', 'month', 'lastMonth', 'custom',
  ];

  const scopeOptions: ScopeFilter[] = isAdmin
    ? ['mine', 'created', 'assigned', 'team']
    : ['mine', 'created', 'assigned'];

  const activeAdvancedCount =
    (filters.types.events ? 0 : 1) +
    (filters.types.tasks ? 0 : 1) +
    (filters.types.health ? 0 : 1) +
    (filters.priorities.alta ? 0 : 1) +
    (filters.priorities.media ? 0 : 1) +
    (filters.priorities.baixa ? 0 : 1) +
    (filters.statuses.pendente ? 0 : 1) +
    (filters.statuses.em_andamento ? 0 : 1);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Período */}
        <Select
          value={filters.period}
          onValueChange={(v) => setFilters((s) => ({ ...s, period: v as PeriodPreset }))}
        >
          <SelectTrigger className="h-9 w-auto min-w-[180px]">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((p) => (
              <SelectItem key={p} value={p}>{PERIOD_LABELS[p]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Intervalo personalizado */}
        {filters.period === 'custom' && (
          <Popover open={customOpen} onOpenChange={setCustomOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {filters.customStart && filters.customEnd
                  ? `${format(new Date(filters.customStart), 'dd/MM')} → ${format(new Date(filters.customEnd), 'dd/MM')}`
                  : 'Selecionar intervalo'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{
                  from: filters.customStart ? new Date(filters.customStart) : undefined,
                  to: filters.customEnd ? new Date(filters.customEnd) : undefined,
                }}
                onSelect={(r) => {
                  setFilters((s) => ({
                    ...s,
                    customStart: r?.from?.toISOString(),
                    customEnd: r?.to?.toISOString(),
                  }));
                  if (r?.from && r?.to) setCustomOpen(false);
                }}
                numberOfMonths={2}
                locale={ptBR}
                className={cn('p-3 pointer-events-auto')}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Escopo */}
        <Select
          value={filters.scope}
          onValueChange={(v) => setFilters((s) => ({ ...s, scope: v as ScopeFilter }))}
        >
          <SelectTrigger className="h-9 w-auto min-w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scopeOptions.map((o) => (
              <SelectItem key={o} value={o}>{SCOPE_LABELS[o]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Avançados */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeAdvancedCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">{activeAdvancedCount}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Tipo</p>
                {(['events', 'tasks', 'health'] as const).map((t) => (
                  <label key={t} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox
                      checked={filters.types[t]}
                      onCheckedChange={(v) =>
                        setFilters((s) => ({ ...s, types: { ...s.types, [t]: !!v } }))
                      }
                    />
                    <span className="text-sm">
                      {t === 'events' ? 'Eventos' : t === 'tasks' ? 'Tarefas' : 'Saúde'}
                    </span>
                  </label>
                ))}
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Prioridade</p>
                {(['alta', 'media', 'baixa'] as const).map((p) => (
                  <label key={p} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox
                      checked={filters.priorities[p]}
                      onCheckedChange={(v) =>
                        setFilters((s) => ({ ...s, priorities: { ...s.priorities, [p]: !!v } }))
                      }
                    />
                    <span className="text-sm capitalize">{p === 'media' ? 'Média' : p}</span>
                  </label>
                ))}
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Status</p>
                {(['pendente', 'em_andamento'] as const).map((st) => (
                  <label key={st} className="flex items-center gap-2 py-1 cursor-pointer">
                    <Checkbox
                      checked={filters.statuses[st]}
                      onCheckedChange={(v) =>
                        setFilters((s) => ({ ...s, statuses: { ...s.statuses, [st]: !!v } }))
                      }
                    />
                    <span className="text-sm capitalize">
                      {st === 'em_andamento' ? 'Em andamento' : 'Pendente'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" className="h-9 gap-1" onClick={onReset}>
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="text-xs">Limpar</span>
        </Button>
      </div>

      {/* Resumo */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>
          Mostrando: <span className="font-medium text-foreground">
            {format(range.start, "dd 'de' MMM", { locale: ptBR })} → {format(range.end, "dd 'de' MMM", { locale: ptBR })}
          </span>
        </span>
        <span>·</span>
        <span>{counts.events} eventos</span>
        <span>·</span>
        <span>{counts.tasks} tarefas</span>
        {counts.overdue > 0 && (
          <>
            <span>·</span>
            <span className="text-destructive font-medium">{counts.overdue} atrasadas</span>
          </>
        )}
      </div>
    </div>
  );
}
