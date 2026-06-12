import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import {
  useArchivedPendencies, usePendencyBoards,
  usePendencyColumns, useRestorePendency, useDeletePendency, useProfilesLite,
} from "@/hooks/use-pendencies";

const PendencyArchivedPage = () => {
  const { boardId = "" } = useParams();
  const navigate = useNavigate();
  const { data: boards = [] } = usePendencyBoards();
  const { data: columns = [] } = usePendencyColumns(boardId);
  const { data: pendencies = [], isLoading } = useArchivedPendencies(boardId);
  const { data: profiles = [] } = useProfilesLite();

  const restore = useRestorePendency();
  const remove = useDeletePendency();

  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const board = boards.find(b => b.id === boardId);
  const columnMap = useMemo(() => Object.fromEntries(columns.map(c => [c.id, c])), [columns]);
  const profileMap = useMemo(() => Object.fromEntries(profiles.map(p => [p.user_id, p.full_name])), [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendencies;
    return pendencies.filter(p =>
      p.titulo.toLowerCase().includes(q) ||
      (p.descricao || "").toLowerCase().includes(q)
    );
  }, [pendencies, search]);

  return (
    <MainLayout>
      <PageLayout
        title={`Arquivados — ${board?.nome || "Quadro"}`}
        subtitle="Pendências concluídas há mais de 30 dias ou arquivadas manualmente"
        actionButton={
          <Button variant="outline" onClick={() => navigate(`/pendencias/${boardId}`)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar ao quadro
          </Button>
        }
      >
        <div className="mb-4">
          <Input
            placeholder="Buscar por título ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Coluna de origem</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Arquivada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {pendencies.length === 0 ? "Nenhuma pendência arquivada." : "Nenhum resultado para a busca."}
                </TableCell></TableRow>
              ) : (
                filtered.map(p => {
                  const col = columnMap[p.column_id];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.titulo}</TableCell>
                      <TableCell>
                        {col ? (
                          <Badge variant="secondary" style={{ backgroundColor: col.cor || undefined, color: "#fff" }}>
                            {col.nome}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.arquivamento_tipo === "manual" ? "default" : "outline"}>
                          {p.arquivamento_tipo === "manual" ? "Manual" : "Automático"}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.responsavel_id ? profileMap[p.responsavel_id] || "—" : "—"}</TableCell>
                      <TableCell>
                        {p.arquivado_efetivo_em
                          ? format(new Date(p.arquivado_efetivo_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => restore.mutate(p.id)}
                            disabled={restore.isPending}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" /> Restaurar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConfirmDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A pendência e todo o histórico associado serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmDelete) {
                    remove.mutate(confirmDelete);
                    setConfirmDelete(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

export default PendencyArchivedPage;
