import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, ChevronRight, Archive } from "lucide-react";
import { PendencyColumn, Pendency, useArchiveOldPendencies } from "@/hooks/use-pendencies";
import { PendencyCard } from "./pendency-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: PendencyColumn;
  pendencies: Pendency[];
  profileNameMap: Record<string, string>;
  onCardClick: (p: Pendency) => void;
  onAddCard: (columnId: string) => void;
  canAdd: boolean;
}

const PREVIEW_COUNT = 10;

export function KanbanColumn({ column, pendencies, profileNameMap, onCardClick, onAddCard, canAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const isCollapsibleKind = column.kind === "done" || column.kind === "rejected";
  const [collapsed, setCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const archiveOld = useArchiveOldPendencies();

  const overLimit = column.wip_limit != null && pendencies.length > column.wip_limit;

  const visible = isCollapsibleKind && !showAll
    ? pendencies.slice(0, PREVIEW_COUNT)
    : pendencies;
  const hiddenCount = pendencies.length - visible.length;

  return (
    <div className="flex flex-col w-72 shrink-0 bg-muted/40 rounded-lg border">
      <div className="flex items-center justify-between p-3 border-b" style={{ borderTopColor: column.cor || undefined, borderTopWidth: 3 }}>
        <button
          type="button"
          onClick={() => isCollapsibleKind && setCollapsed(c => !c)}
          className={cn(
            "flex items-center gap-2 min-w-0 text-left",
            isCollapsibleKind && "hover:opacity-80"
          )}
        >
          {isCollapsibleKind && (
            collapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm truncate">{column.nome}</h3>
          <Badge variant={overLimit ? "destructive" : "secondary"} className="h-5 text-[10px]">
            {pendencies.length}{column.wip_limit ? `/${column.wip_limit}` : ""}
          </Badge>
        </button>
        <div className="flex items-center gap-1">
          {isCollapsibleKind && !collapsed && pendencies.length > 0 && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              title="Arquivar concluídas/rejeitadas há mais de 30 dias"
              onClick={() => archiveOld.mutate(column.board_id)}
              disabled={archiveOld.isPending}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
          {canAdd && !collapsed && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddCard(column.id)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            "flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto transition-colors",
            isOver && "bg-accent/50"
          )}
        >
          <SortableContext items={visible.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {visible.map(p => (
              <PendencyCard
                key={p.id}
                pendency={p}
                responsavelName={p.responsavel_id ? profileNameMap[p.responsavel_id] : undefined}
                onClick={() => onCardClick(p)}
              />
            ))}
          </SortableContext>
          {pendencies.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-6">Sem cards</div>
          )}
          {hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowAll(true)}
            >
              Ver mais {hiddenCount}
            </Button>
          )}
          {showAll && isCollapsibleKind && pendencies.length > PREVIEW_COUNT && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => setShowAll(false)}
            >
              Mostrar menos
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
