import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  endOfWeek, isPast, isToday, isWithinInterval, parseISO, startOfDay, startOfWeek,
} from "date-fns";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Settings2, ArrowLeft, KanbanSquare, List, Archive } from "lucide-react";
import { KanbanBoard } from "@/components/pendencies/kanban-board";
import { PendencyDialog } from "@/components/pendencies/pendency-dialog";
import { BoardSettingsDialog } from "@/components/pendencies/board-settings-dialog";
import { BoardFilters, BoardFilterState, EMPTY_FILTERS, PrazoFilter, ScopeFilter } from "@/components/pendencies/board-filters";
import { PendencyListView } from "@/components/pendencies/pendency-list-view";
import {
  Pendency, PendencyPriority,
  usePendencyBoards, usePendencyColumns, usePendencies, useProfilesLite,
} from "@/hooks/use-pendencies";
import { useAuth } from "@/hooks/use-auth";

type ViewMode = "kanban" | "list";
const VIEW_STORAGE_KEY = "pendency_board_view";
const PRIORITIES: PendencyPriority[] = ["baixa", "media", "alta", "urgente"];
const PRAZO_VALUES: PrazoFilter[] = ["atrasadas", "hoje", "semana", "sem_prazo"];

function parseFiltersFromUrl(sp: URLSearchParams): BoardFilterState {
  const scope = (sp.get("scope") || "todas") as ScopeFilter;
  const prazo = sp.get("prazo") as PrazoFilter;
  return {
    search: sp.get("q") || "",
    scope: scope === "minhas" ? "minhas" : "todas",
    responsaveis: sp.get("resp")?.split(",").filter(Boolean) || [],
    prioridades: (sp.get("pri")?.split(",").filter(Boolean) || []).filter(
      (p): p is PendencyPriority => PRIORITIES.includes(p as PendencyPriority)
    ),
    prazo: PRAZO_VALUES.includes(prazo) ? prazo : "",
  };
}

function filtersToParams(f: BoardFilterState): Record<string, string> {
  const o: Record<string, string> = {};
  if (f.search) o.q = f.search;
  if (f.scope !== "todas") o.scope = f.scope;
  if (f.responsaveis.length) o.resp = f.responsaveis.join(",");
  if (f.prioridades.length) o.pri = f.prioridades.join(",");
  if (f.prazo) o.prazo = f.prazo;
  return o;
}

const PendencyBoardPage = () => {
  const { boardId = "" } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isCoord = ["coordenador", "diretor", "administrador"].includes(profile?.role || "");

  const { data: boards = [], isLoading: loadingBoards } = usePendencyBoards();
  const { data: columns = [] } = usePendencyColumns(boardId);
  const { data: pendencies = [] } = usePendencies(boardId);
  const { data: profiles = [] } = useProfilesLite();

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => parseFiltersFromUrl(searchParams), [searchParams]);

  const setFilters = (next: BoardFilterState) => {
    setSearchParams(filtersToParams(next), { replace: true });
  };

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "kanban";
    return (localStorage.getItem(VIEW_STORAGE_KEY) as ViewMode) || "kanban";
  });
  useEffect(() => { localStorage.setItem(VIEW_STORAGE_KEY, view); }, [view]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPendency, setEditingPendency] = useState<Pendency | null>(null);
  const [initialColumnId, setInitialColumnId] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const board = boards.find(b => b.id === boardId);

  const profileNameMap = useMemo(
    () => Object.fromEntries(profiles.map(p => [p.user_id, p.full_name])),
    [profiles]
  );

  const filtered = useMemo(() => {
    const myId = profile?.user_id;
    const q = filters.search.trim().toLowerCase();
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

    return pendencies.filter(p => {
      if (q && !p.titulo.toLowerCase().includes(q) && !(p.descricao || "").toLowerCase().includes(q)) return false;
      if (filters.scope === "minhas" && myId && p.responsavel_id !== myId && p.solicitante_id !== myId && p.created_by !== myId) return false;
      if (filters.responsaveis.length && (!p.responsavel_id || !filters.responsaveis.includes(p.responsavel_id))) return false;
      if (filters.prioridades.length && !filters.prioridades.includes(p.prioridade)) return false;
      if (filters.prazo) {
        if (filters.prazo === "sem_prazo") {
          if (p.prazo) return false;
        } else {
          if (!p.prazo) return false;
          const prazoDate = parseISO(p.prazo);
          if (filters.prazo === "atrasadas") {
            if (!(isPast(prazoDate) && !p.data_entrega)) return false;
          } else if (filters.prazo === "hoje") {
            if (!isToday(prazoDate)) return false;
          } else if (filters.prazo === "semana") {
            if (!isWithinInterval(prazoDate, { start: weekStart, end: weekEnd })) return false;
          }
        }
      }
      return true;
    });
  }, [pendencies, filters, profile?.user_id]);

  const handleOpenNew = (colId?: string) => {
    setEditingPendency(null);
    setInitialColumnId(colId);
    setDialogOpen(true);
  };

  const handleOpenEdit = (p: Pendency) => {
    setEditingPendency(p);
    setDialogOpen(true);
  };

  if (!loadingBoards && !board) {
    return (
      <MainLayout>
        <PageLayout title="Quadro não encontrado" subtitle="">
          <Button variant="outline" onClick={() => navigate("/pendencias")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para quadros
          </Button>
        </PageLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageLayout
        title={board?.nome || "Quadro"}
        subtitle={board?.descricao || "Controle Kanban de demandas"}
        actionButton={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/pendencias")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Quadros
            </Button>
            <Button variant="outline" onClick={() => navigate(`/pendencias/${boardId}/arquivados`)} disabled={!boardId}>
              <Archive className="h-4 w-4 mr-1" /> Arquivados
            </Button>
            <Button variant="outline" onClick={() => handleOpenNew()} disabled={!boardId}>
              <Plus className="h-4 w-4 mr-1" /> Nova pendência
            </Button>
            {isCoord && (
              <Button variant="outline" onClick={() => setSettingsOpen(true)} disabled={!board}>
                <Settings2 className="h-4 w-4 mr-1" /> Configurar
              </Button>
            )}
          </div>
        }
      >
        <BoardFilters filters={filters} onChange={setFilters} profiles={profiles} />

        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-muted-foreground">
            {filtered.length} de {pendencies.length} pendência{pendencies.length !== 1 ? "s" : ""}
          </div>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)}>
            <ToggleGroupItem value="kanban" aria-label="Kanban" size="sm">
              <KanbanSquare className="h-4 w-4 mr-1" /> Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Lista" size="sm">
              <List className="h-4 w-4 mr-1" /> Lista
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {loadingBoards ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : view === "kanban" ? (
          <KanbanBoard
            columns={columns}
            pendencies={filtered}
            onCardClick={handleOpenEdit}
            onAddCard={handleOpenNew}
            canEdit
          />
        ) : (
          <PendencyListView
            columns={columns}
            pendencies={filtered}
            profileNameMap={profileNameMap}
            onRowClick={handleOpenEdit}
          />
        )}

        {boardId && (
          <PendencyDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            boardId={boardId}
            columns={columns}
            pendency={editingPendency}
            initialColumnId={initialColumnId}
          />
        )}

        {board && (
          <BoardSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} board={board} />
        )}
      </PageLayout>
    </MainLayout>
  );
};

export default PendencyBoardPage;
