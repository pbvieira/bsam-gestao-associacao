import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  KanbanSquare, Plus, Star, MoreVertical, Archive, ArchiveRestore, Trash2, Settings2,
  AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import {
  PendencyBoardOverview,
  usePendencyBoardsOverview, useCreateBoard, useArchiveBoard,
  useDeleteBoard, useToggleBoardFavorite,
} from "@/hooks/use-pendencies";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const Pendencies = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isCoord = ["coordenador", "diretor", "administrador"].includes(profile?.role || "");

  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [newBoardOpen, setNewBoardOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<PendencyBoardOverview | null>(null);

  const { data: boards = [], isLoading } = usePendencyBoardsOverview(includeArchived);
  const createBoardMut = useCreateBoard();
  const archiveMut = useArchiveBoard();
  const deleteMut = useDeleteBoard();
  const favMut = useToggleBoardFavorite();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return boards.filter(b => {
      if (!q) return true;
      return b.nome.toLowerCase().includes(q) || (b.descricao || "").toLowerCase().includes(q);
    });
  }, [boards, search]);

  const favorites = filtered.filter(b => b.is_favorite && !b.arquivado_em);
  const active = filtered.filter(b => !b.is_favorite && !b.arquivado_em);
  const archived = filtered.filter(b => !!b.arquivado_em);

  return (
    <MainLayout>
      <PageLayout
        title="Pendências"
        subtitle="Quadros Kanban da coordenação"
        actionButton={
          <Button onClick={() => setNewBoardOpen(true)} disabled={!isCoord}>
            <KanbanSquare className="h-4 w-4 mr-1" /> Novo quadro
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Input
            placeholder="Buscar quadro..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-72"
          />
          <div className="flex items-center gap-2">
            <Switch id="archived" checked={includeArchived} onCheckedChange={setIncludeArchived} />
            <Label htmlFor="archived" className="cursor-pointer">Mostrar arquivados</Label>
          </div>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Carregando quadros...</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            {search ? "Nenhum quadro encontrado." : "Nenhum quadro disponível."}
          </div>
        ) : (
          <div className="space-y-8">
            {favorites.length > 0 && (
              <Section title="Favoritos">
                <BoardGrid
                  boards={favorites}
                  onOpen={(b) => navigate(`/pendencias/${b.id}`)}
                  onToggleFav={(b) => favMut.mutate({ boardId: b.id, favorite: !b.is_favorite })}
                  onArchive={(b) => archiveMut.mutate({ id: b.id, archive: true })}
                  onRestore={(b) => archiveMut.mutate({ id: b.id, archive: false })}
                  onDelete={(b) => setBoardToDelete(b)}
                  onConfigure={(b) => navigate(`/pendencias/${b.id}`)}
                  isCoord={isCoord}
                />
              </Section>
            )}
            {active.length > 0 && (
              <Section title={favorites.length > 0 ? "Outros quadros" : "Quadros"}>
                <BoardGrid
                  boards={active}
                  onOpen={(b) => navigate(`/pendencias/${b.id}`)}
                  onToggleFav={(b) => favMut.mutate({ boardId: b.id, favorite: !b.is_favorite })}
                  onArchive={(b) => archiveMut.mutate({ id: b.id, archive: true })}
                  onRestore={(b) => archiveMut.mutate({ id: b.id, archive: false })}
                  onDelete={(b) => setBoardToDelete(b)}
                  onConfigure={(b) => navigate(`/pendencias/${b.id}`)}
                  isCoord={isCoord}
                />
              </Section>
            )}
            {archived.length > 0 && (
              <Section title="Arquivados">
                <BoardGrid
                  boards={archived}
                  onOpen={(b) => navigate(`/pendencias/${b.id}`)}
                  onToggleFav={(b) => favMut.mutate({ boardId: b.id, favorite: !b.is_favorite })}
                  onArchive={(b) => archiveMut.mutate({ id: b.id, archive: true })}
                  onRestore={(b) => archiveMut.mutate({ id: b.id, archive: false })}
                  onDelete={(b) => setBoardToDelete(b)}
                  onConfigure={(b) => navigate(`/pendencias/${b.id}`)}
                  isCoord={isCoord}
                />
              </Section>
            )}
          </div>
        )}

        <NewBoardDialog
          open={newBoardOpen}
          onOpenChange={setNewBoardOpen}
          onCreate={async (nome, descricao) => {
            const b = await createBoardMut.mutateAsync({ nome, descricao });
            navigate(`/pendencias/${b.id}`);
          }}
        />

        <AlertDialog open={!!boardToDelete} onOpenChange={(o) => !o && setBoardToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir quadro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Todas as pendências, comentários e histórico do quadro
                "{boardToDelete?.nome}" serão permanentemente removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (boardToDelete) {
                    await deleteMut.mutateAsync(boardToDelete.id);
                    setBoardToDelete(null);
                  }
                }}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayout>
    </MainLayout>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

interface BoardGridProps {
  boards: PendencyBoardOverview[];
  onOpen: (b: PendencyBoardOverview) => void;
  onToggleFav: (b: PendencyBoardOverview) => void;
  onArchive: (b: PendencyBoardOverview) => void;
  onRestore: (b: PendencyBoardOverview) => void;
  onDelete: (b: PendencyBoardOverview) => void;
  onConfigure: (b: PendencyBoardOverview) => void;
  isCoord: boolean;
}

function BoardGrid({ boards, onOpen, onToggleFav, onArchive, onRestore, onDelete, onConfigure, isCoord }: BoardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {boards.map(b => (
        <BoardCard
          key={b.id}
          board={b}
          onOpen={() => onOpen(b)}
          onToggleFav={() => onToggleFav(b)}
          onArchive={() => onArchive(b)}
          onRestore={() => onRestore(b)}
          onDelete={() => onDelete(b)}
          onConfigure={() => onConfigure(b)}
          isCoord={isCoord}
        />
      ))}
    </div>
  );
}

interface BoardCardProps {
  board: PendencyBoardOverview;
  onOpen: () => void;
  onToggleFav: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onConfigure: () => void;
  isCoord: boolean;
}

function BoardCard({ board, onOpen, onToggleFav, onArchive, onRestore, onDelete, onConfigure, isCoord }: BoardCardProps) {
  const isArchived = !!board.arquivado_em;
  return (
    <Card
      onClick={onOpen}
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow group relative",
        isArchived && "opacity-70"
      )}
    >
      <div
        className="h-1.5 rounded-t-lg"
        style={{ background: board.cor || "hsl(var(--primary))" }}
      />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{board.nome}</h3>
              {board.is_default && <Badge variant="secondary" className="text-[10px]">Padrão</Badge>}
              {isArchived && <Badge variant="outline" className="text-[10px]">Arquivado</Badge>}
            </div>
            {board.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{board.descricao}</p>
            )}
          </div>
          <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onToggleFav}
              title={board.is_favorite ? "Remover dos favoritos" : "Marcar como favorito"}
            >
              <Star className={cn("h-4 w-4", board.is_favorite && "fill-yellow-400 text-yellow-500")} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onConfigure}>
                  <Settings2 className="h-4 w-4 mr-2" /> Abrir e configurar
                </DropdownMenuItem>
                {isCoord && (
                  <>
                    <DropdownMenuSeparator />
                    {isArchived ? (
                      <DropdownMenuItem onClick={onRestore}>
                        <ArchiveRestore className="h-4 w-4 mr-2" /> Restaurar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={onArchive} disabled={board.is_default}>
                        <Archive className="h-4 w-4 mr-2" /> Arquivar
                      </DropdownMenuItem>
                    )}
                    {!board.is_default && (
                      <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric
            icon={<Clock className="h-3.5 w-3.5" />}
            value={board.total_abertas}
            label="Abertas"
          />
          <Metric
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            value={board.total_atrasadas}
            label="Atrasadas"
            highlight={board.total_atrasadas > 0}
          />
          <Metric
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
            value={board.total_concluidas_mes}
            label="Mês"
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          Atualizado {formatDistanceToNow(new Date(board.ultimo_movimento), { addSuffix: true, locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, value, label, highlight }: { icon: React.ReactNode; value: number; label: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-md border bg-muted/30 py-1.5",
      highlight && "border-destructive/50 bg-destructive/5"
    )}>
      <div className={cn("flex items-center justify-center gap-1 text-xs font-semibold", highlight && "text-destructive")}>
        {icon}
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function NewBoardDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (nome: string, descricao?: string) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo quadro</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={async () => {
            if (nome.trim()) {
              await onCreate(nome, descricao);
              setNome(""); setDescricao(""); onOpenChange(false);
            }
          }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Pendencies;
