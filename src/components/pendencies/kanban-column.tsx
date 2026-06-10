import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { PendencyColumn, Pendency } from "@/hooks/use-pendencies";
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

export function KanbanColumn({ column, pendencies, profileNameMap, onCardClick, onAddCard, canAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const overLimit = column.wip_limit != null && pendencies.length > column.wip_limit;

  return (
    <div className="flex flex-col w-72 shrink-0 bg-muted/40 rounded-lg border">
      <div className="flex items-center justify-between p-3 border-b" style={{ borderTopColor: column.cor || undefined, borderTopWidth: 3 }}>
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm truncate">{column.nome}</h3>
          <Badge variant={overLimit ? "destructive" : "secondary"} className="h-5 text-[10px]">
            {pendencies.length}{column.wip_limit ? `/${column.wip_limit}` : ""}
          </Badge>
        </div>
        {canAdd && (
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddCard(column.id)}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto transition-colors",
          isOver && "bg-accent/50"
        )}
      >
        <SortableContext items={pendencies.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {pendencies.map(p => (
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
      </div>
    </div>
  );
}
