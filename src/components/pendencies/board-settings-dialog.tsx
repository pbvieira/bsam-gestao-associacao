import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import {
  PendencyBoard, PendencyColumn, PendencyColumnKind,
  useUpdateBoard, useDeleteBoard,
  usePendencyColumns, useUpsertColumn, useDeleteColumn,
} from "@/hooks/use-pendencies";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  board: PendencyBoard;
}

export function BoardSettingsDialog({ open, onOpenChange, board }: Props) {
  const { data: columns = [] } = usePendencyColumns(board.id);
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();
  const upsertCol = useUpsertColumn();
  const deleteCol = useDeleteColumn();
  const [nome, setNome] = useState(board.nome);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar quadro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label>Nome do quadro</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <Button onClick={() => updateBoard.mutate({ id: board.id, nome })}>Salvar</Button>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <Label className="font-semibold">Colunas</Label>
              <Button size="sm" variant="outline" onClick={() => upsertCol.mutate({ board_id: board.id, nome: "Nova coluna", posicao: columns.length, kind: "open" })}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            <div className="space-y-2">
              {columns.map(col => (
                <ColumnRow key={col.id} col={col} onSave={(c) => upsertCol.mutate(c as any)} onDelete={() => deleteCol.mutate({ id: col.id, board_id: board.id })} />
              ))}
            </div>
          </div>

          {!board.is_default && (
            <div className="border-t pt-4">
              <Button variant="destructive" size="sm" onClick={async () => {
                if (confirm("Excluir o quadro inteiro? Esta ação removerá todas as pendências.")) {
                  await deleteBoard.mutateAsync(board.id);
                  onOpenChange(false);
                }
              }}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir quadro
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ColumnRow({ col, onSave, onDelete }: { col: PendencyColumn; onSave: (c: Partial<PendencyColumn>) => void; onDelete: () => void }) {
  const [nome, setNome] = useState(col.nome);
  const [cor, setCor] = useState(col.cor || "#94a3b8");
  const [wip, setWip] = useState<string>(col.wip_limit?.toString() || "");
  const [kind, setKind] = useState<PendencyColumnKind>(col.kind);

  return (
    <div className="flex items-center gap-2 border rounded p-2">
      <Input className="w-40" value={nome} onChange={e => setNome(e.target.value)} />
      <input type="color" value={cor} onChange={e => setCor(e.target.value)} className="h-8 w-10 rounded border" />
      <Input className="w-20" type="number" placeholder="WIP" value={wip} onChange={e => setWip(e.target.value)} />
      <Select value={kind} onValueChange={(v: PendencyColumnKind) => setKind(v)}>
        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Aberta</SelectItem>
          <SelectItem value="blocked">Bloqueada</SelectItem>
          <SelectItem value="done">Concluída</SelectItem>
          <SelectItem value="rejected">Rejeitada</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={() => onSave({ id: col.id, board_id: col.board_id, nome, cor, posicao: col.posicao, wip_limit: wip ? Number(wip) : null, kind, is_final: kind === "done" || kind === "rejected" })}>
        Salvar
      </Button>
      <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
  );
}
