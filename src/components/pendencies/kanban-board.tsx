import { useMemo, useState } from "react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { PendencyCard } from "./pendency-card";
import { Pendency, PendencyColumn, useProfilesLite, useUpdatePendency } from "@/hooks/use-pendencies";

interface KanbanBoardProps {
  columns: PendencyColumn[];
  pendencies: Pendency[];
  onCardClick: (p: Pendency) => void;
  onAddCard: (columnId: string) => void;
  canEdit: boolean;
}

export function KanbanBoard({ columns, pendencies, onCardClick, onAddCard, canEdit }: KanbanBoardProps) {
  const { data: profiles = [] } = useProfilesLite();
  const updateMut = useUpdatePendency();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const profileNameMap = useMemo(
    () => Object.fromEntries(profiles.map(p => [p.user_id, p.full_name])),
    [profiles]
  );

  const byColumn = useMemo(() => {
    const map: Record<string, Pendency[]> = {};
    columns.forEach(c => (map[c.id] = []));
    pendencies.forEach(p => {
      (map[p.column_id] ||= []).push(p);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.posicao - b.posicao));
    return map;
  }, [columns, pendencies]);

  const activePendency = pendencies.find(p => p.id === activeId);

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const pendency = pendencies.find(p => p.id === active.id);
    if (!pendency) return;

    // Drop pode ser em coluna ou em outro card
    let targetColumnId: string | null = null;
    const overData = over.data.current as any;
    if (overData?.type === "column") {
      targetColumnId = overData.column.id;
    } else if (overData?.type === "pendency") {
      targetColumnId = overData.pendency.column_id;
    } else if (columns.find(c => c.id === over.id)) {
      targetColumnId = String(over.id);
    }
    if (!targetColumnId) return;
    if (targetColumnId === pendency.column_id) return; // sem reordenar dentro por enquanto

    updateMut.mutate({ id: pendency.id, column_id: targetColumnId, posicao: (byColumn[targetColumnId]?.length || 0) });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {columns.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            pendencies={byColumn[col.id] || []}
            profileNameMap={profileNameMap}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
            canAdd={canEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activePendency && (
          <PendencyCard
            pendency={activePendency}
            responsavelName={activePendency.responsavel_id ? profileNameMap[activePendency.responsavel_id] : undefined}
            onClick={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
