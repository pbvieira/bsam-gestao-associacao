import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle } from "lucide-react";
import { Pendency, PendencyColumn, PendencyPriority } from "@/hooks/use-pendencies";
import { cn } from "@/lib/utils";

const PRIORITY_LABELS: Record<PendencyPriority, string> = {
  baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente",
};
const PRIORITY_COLORS: Record<PendencyPriority, string> = {
  baixa: "bg-slate-400", media: "bg-blue-500", alta: "bg-orange-500", urgente: "bg-red-600",
};

interface Props {
  pendencies: Pendency[];
  columns: PendencyColumn[];
  profileNameMap: Record<string, string>;
  onRowClick: (p: Pendency) => void;
}

export function PendencyListView({ pendencies, columns, profileNameMap, onRowClick }: Props) {
  const colMap = Object.fromEntries(columns.map(c => [c.id, c]));

  if (pendencies.length === 0) {
    return <div className="text-sm text-muted-foreground text-center py-12">Nenhuma pendência encontrada.</div>;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Atualizada</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendencies.map(p => {
            const col = colMap[p.column_id];
            const responsavelName = p.responsavel_id ? profileNameMap[p.responsavel_id] : null;
            const initials = responsavelName
              ? responsavelName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              : "?";
            const overdue = !!(p.prazo && !p.data_entrega && isPast(parseISO(p.prazo)));
            return (
              <TableRow key={p.id} className="cursor-pointer" onClick={() => onRowClick(p)}>
                <TableCell className="font-medium max-w-sm">
                  <div className="truncate">{p.titulo}</div>
                  {p.descricao && <div className="text-xs text-muted-foreground truncate">{p.descricao}</div>}
                </TableCell>
                <TableCell>
                  {col && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: col.cor || undefined, color: col.cor || undefined }}>
                      {col.nome}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {responsavelName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials}</AvatarFallback></Avatar>
                      <span className="text-sm truncate">{responsavelName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_COLORS[p.prioridade])} />
                    <span className="text-xs">{PRIORITY_LABELS[p.prioridade]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {p.prazo ? (
                    <div className={cn("flex items-center gap-1 text-xs", overdue && "text-destructive font-medium")}>
                      {overdue && <AlertTriangle className="h-3 w-3" />}
                      {format(parseISO(p.prazo), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(parseISO(p.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
