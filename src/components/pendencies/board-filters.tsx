import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Users, X } from "lucide-react";
import { PendencyPriority } from "@/hooks/use-pendencies";
import { cn } from "@/lib/utils";

export type PrazoFilter = "" | "atrasadas" | "hoje" | "semana" | "sem_prazo";
export type ScopeFilter = "todas" | "minhas";

export interface BoardFilterState {
  search: string;
  scope: ScopeFilter;
  responsaveis: string[];
  prioridades: PendencyPriority[];
  prazo: PrazoFilter;
}

export const EMPTY_FILTERS: BoardFilterState = {
  search: "",
  scope: "todas",
  responsaveis: [],
  prioridades: [],
  prazo: "",
};

const PRIORITY_LABELS: Record<PendencyPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

const PRIORITY_COLORS: Record<PendencyPriority, string> = {
  baixa: "bg-slate-400",
  media: "bg-blue-500",
  alta: "bg-orange-500",
  urgente: "bg-red-600",
};

const PRAZO_OPTIONS: Array<{ value: PrazoFilter; label: string }> = [
  { value: "atrasadas", label: "Atrasadas" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "sem_prazo", label: "Sem prazo" },
];

interface Props {
  filters: BoardFilterState;
  onChange: (next: BoardFilterState) => void;
  profiles: Array<{ user_id: string; full_name: string }>;
}

export function BoardFilters({ filters, onChange, profiles }: Props) {
  const toggleArr = <T extends string>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const hasActive = !!(
    filters.search || filters.scope !== "todas" ||
    filters.responsaveis.length || filters.prioridades.length || filters.prazo
  );

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Input
        placeholder="Buscar título ou descrição..."
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        className="w-64"
      />

      <Button
        variant={filters.scope === "minhas" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange({ ...filters, scope: filters.scope === "minhas" ? "todas" : "minhas" })}
      >
        Minhas
      </Button>

      {/* Responsáveis */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Responsável
            {filters.responsaveis.length > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">{filters.responsaveis.length}</Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2 max-h-72 overflow-y-auto" align="start">
          <div className="space-y-1">
            {profiles.map(p => {
              const checked = filters.responsaveis.includes(p.user_id);
              const initials = p.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <button
                  key={p.user_id}
                  type="button"
                  onClick={() => onChange({ ...filters, responsaveis: toggleArr(filters.responsaveis, p.user_id) })}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent text-left",
                    checked && "bg-accent"
                  )}
                >
                  <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials}</AvatarFallback></Avatar>
                  <span className="flex-1 truncate">{p.full_name}</span>
                  {checked && <Check className="h-3.5 w-3.5" />}
                </button>
              );
            })}
            {profiles.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">Nenhum usuário</p>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Prioridade */}
      <div className="flex items-center gap-1">
        {(Object.keys(PRIORITY_LABELS) as PendencyPriority[]).map(p => {
          const active = filters.prioridades.includes(p);
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...filters, prioridades: toggleArr(filters.prioridades, p) })}
              className={cn(
                "h-8 px-2.5 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_COLORS[p])} />
              {PRIORITY_LABELS[p]}
            </button>
          );
        })}
      </div>

      {/* Prazo */}
      <div className="flex items-center gap-1">
        {PRAZO_OPTIONS.map(opt => {
          const active = filters.prazo === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ ...filters, prazo: active ? "" : opt.value })}
              className={cn(
                "h-8 px-2.5 rounded-md border text-xs font-medium transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {hasActive && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)} className="text-muted-foreground">
          <X className="h-3.5 w-3.5 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}
