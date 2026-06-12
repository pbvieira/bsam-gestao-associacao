import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings2, ArrowLeft } from "lucide-react";
import { KanbanBoard } from "@/components/pendencies/kanban-board";
import { PendencyDialog } from "@/components/pendencies/pendency-dialog";
import { BoardSettingsDialog } from "@/components/pendencies/board-settings-dialog";
import {
  Pendency, usePendencyBoards, usePendencyColumns, usePendencies,
} from "@/hooks/use-pendencies";
import { useAuth } from "@/hooks/use-auth";

const PendencyBoardPage = () => {
  const { boardId = "" } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isCoord = ["coordenador", "diretor", "administrador"].includes(profile?.role || "");

  const { data: boards = [], isLoading: loadingBoards } = usePendencyBoards();
  const { data: columns = [] } = usePendencyColumns(boardId);
  const { data: pendencies = [] } = usePendencies(boardId);

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"todas" | "minhas">("todas");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPendency, setEditingPendency] = useState<Pendency | null>(null);
  const [initialColumnId, setInitialColumnId] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const board = boards.find(b => b.id === boardId);

  const filtered = useMemo(() => {
    const myId = profile?.user_id;
    return pendencies.filter(p => {
      if (search && !p.titulo.toLowerCase().includes(search.toLowerCase()) && !(p.descricao || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (scope === "minhas" && myId && p.responsavel_id !== myId && p.solicitante_id !== myId && p.created_by !== myId) return false;
      return true;
    });
  }, [pendencies, search, scope, profile?.user_id]);

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
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
          <Select value={scope} onValueChange={(v: any) => setScope(v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="minhas">Minhas pendências</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingBoards ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : (
          <KanbanBoard
            columns={columns}
            pendencies={filtered}
            onCardClick={handleOpenEdit}
            onAddCard={handleOpenNew}
            canEdit
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
