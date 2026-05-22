import { useEffect, useMemo, useState } from 'react';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, addDays, subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type PeriodPreset =
  | 'today'
  | 'tomorrow'
  | 'next7'
  | 'next30'
  | 'week'
  | 'month'
  | 'lastMonth'
  | 'custom';

export type ScopeFilter = 'mine' | 'created' | 'assigned' | 'team';

export interface DashboardFiltersState {
  period: PeriodPreset;
  customStart?: string; // ISO date
  customEnd?: string;
  scope: ScopeFilter;
  types: { events: boolean; tasks: boolean; health: boolean };
  priorities: { alta: boolean; media: boolean; baixa: boolean };
  statuses: { pendente: boolean; em_andamento: boolean };
}

const STORAGE_KEY = 'dashboard-filters-v1';

const DEFAULTS: DashboardFiltersState = {
  period: 'next7',
  scope: 'mine',
  types: { events: true, tasks: true, health: true },
  priorities: { alta: true, media: true, baixa: true },
  statuses: { pendente: true, em_andamento: true },
};

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: 'Hoje',
  tomorrow: 'Amanhã',
  next7: 'Próximos 7 dias',
  next30: 'Próximos 30 dias',
  week: 'Esta semana',
  month: 'Este mês',
  lastMonth: 'Mês passado',
  custom: 'Período personalizado',
};

export const SCOPE_LABELS: Record<ScopeFilter, string> = {
  mine: 'Minhas (criadas + atribuídas)',
  created: 'Que criei',
  assigned: 'Atribuídas a mim',
  team: 'Da equipe',
};

export function resolvePeriod(state: DashboardFiltersState): { start: Date; end: Date } {
  const now = new Date();
  switch (state.period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'tomorrow': {
      const t = addDays(now, 1);
      return { start: startOfDay(t), end: endOfDay(t) };
    }
    case 'next7':
      return { start: startOfDay(now), end: endOfDay(addDays(now, 6)) };
    case 'next30':
      return { start: startOfDay(now), end: endOfDay(addDays(now, 29)) };
    case 'week':
      return { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return { start: startOfMonth(lm), end: endOfMonth(lm) };
    }
    case 'custom': {
      const s = state.customStart ? new Date(state.customStart) : startOfDay(now);
      const e = state.customEnd ? new Date(state.customEnd) : endOfDay(now);
      return { start: startOfDay(s), end: endOfDay(e) };
    }
  }
}

export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFiltersState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {}
    return DEFAULTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {}
  }, [filters]);

  const range = useMemo(() => resolvePeriod(filters), [filters]);

  const reset = () => setFilters(DEFAULTS);

  return { filters, setFilters, range, reset };
}
