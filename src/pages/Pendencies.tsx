import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Settings2, KanbanSquare } from "lucide-react";
import { KanbanBoard } from "@/components/pendencies/kanban-board";
import { PendencyDialog } from "@/components/pendencies/pendency-dialog";
import { BoardSettingsDialog } from "@/components/pendencies/board-settings-dialog";
import {
  Pendency, usePendencyBoards, usePendencyColumns, usePendencies, useCreateBoard,
} from "@/hooks/use-pendencies";
import { useAuth } from "@/hooks/use-auth";

const Pendencies = () => {
  const { profile } = useAuth();
  const isCoord = ["coordenador", "diretor", "administrador"].includes(profile?.role || "");

  const { data: boards = [], isLoading: loadingBoards } = usePendencyBoards();
  const [boardId, setBoardId] = useState<string>("");
  useEffect(() => {
    if (!boardId && boards.length) setBoardId(boards[0].id);
  }, [boards, boardId]);

  const { data: columns = [] } = usePendencyColumns(boardId);
  const { data: pendencies = [] } = usePendencies(boardId);

  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"todas" | "minhas">("todas");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPendency, setEditingPendency] = useState<Pendency | null>(null);
  const [initialColumnId, setInitialColumnId] = useState<string | undefined>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newBoardOpen, setNewBoardOpen] = useState(false);

  const createBoardMut = useCreateBoard();

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

  return (
    <MainLayout>
      <PageLayout
        title="Pendências"
        subtitle="Controle Kanban de demandas da coordenação"
        actionButton={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenNew()} disabled={!boardId}>
              <Plus className="h-4 w-4 mr-1" /> Nova pendência
            </Button>
            {isCoord && (
              <>
                <Button variant="outline" onClick={() => setSettingsOpen(true)} disabled={!board}>
                  <Settings2 className="h-4 w-4 mr-1" /> Quadro
                </Button>
                <Button onClick={() => setNewBoardOpen(true)}>
                  <KanbanSquare className="h-4 w-4 mr-1" /> Novo quadro
                </Button>
              </>
            )}
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Select value={boardId} onValueChange={setBoardId}>
            <SelectTrigger className="w-72"><SelectValue placeholder="Selecione um quadro" /></SelectTrigger>
            <SelectContent>
              {boards.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
            </SelectContent>
          </Select>
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
        ) : boards.length === 0 ? (
          <div className="text-muted-foreground">Nenhum quadro disponível.</div>
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

        <NewBoardDialog
          open={newBoardOpen}
          onOpenChange={setNewBoardOpen}
          onCreate={async (nome, descricao) => {
            const b = await createBoardMut.mutateAsync({ nome, descricao });
            setBoardId(b.id);
          }}
        />
      </PageLayout>
    </MainLayout>
  );
};

function NewBoardDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (nome: string, descricao?: string) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo quadro</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
          <div><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={async () => { if (nome.trim()) { await onCreate(nome, descricao); setNome(""); setDescricao(""); onOpenChange(false); } }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Pendencies;
