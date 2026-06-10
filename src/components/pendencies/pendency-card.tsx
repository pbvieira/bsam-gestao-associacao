import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertTriangle, Calendar, Lock } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pendency, PendencyPriority } from "@/hooks/use-pendencies";
import { cn } from "@/lib/utils";

const priorityColors: Record<PendencyPriority, string> = {
  baixa: "bg-slate-400",
  media: "bg-blue-500",
  alta: "bg-orange-500",
  urgente: "bg-red-600",
};

const priorityLabels: Record<PendencyPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

interface PendencyCardProps {
  pendency: Pendency;
  responsavelName?: string;
  onClick: () => void;
}

export function PendencyCard({ pendency, responsavelName, onClick }: PendencyCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pendency.id,
    data: { type: "pendency", pendency },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isBlocked = !!(pendency.dep_setor_id || pendency.dep_responsavel_id);
  const isOverdue = pendency.prazo && !pendency.data_entrega && isPast(parseISO(pendency.prazo));

  const initials = responsavelName
    ? responsavelName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-grab active:cursor-grabbing p-3 space-y-2 hover:shadow-md transition-shadow",
        isOverdue && "border-l-4 border-l-red-500"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn("w-1 self-stretch rounded-full", priorityColors[pendency.prioridade])} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium leading-tight line-clamp-2">{pendency.titulo}</h4>
          {pendency.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{pendency.descricao}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge variant="outline" className="text-[10px] h-5">
          {priorityLabels[pendency.prioridade]}
        </Badge>
        {isBlocked && (
          <Badge variant="destructive" className="text-[10px] h-5 gap-1">
            <Lock className="h-3 w-3" /> Bloqueada
          </Badge>
        )}
        {pendency.status_aceite === "rejeitada" && (
          <Badge variant="secondary" className="text-[10px] h-5">Rejeitada</Badge>
        )}
        {isOverdue && (
          <Badge variant="destructive" className="text-[10px] h-5 gap-1">
            <AlertTriangle className="h-3 w-3" /> Atrasada
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {pendency.prazo && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(pendency.prazo), "dd/MM", { locale: ptBR })}
            </span>
          )}
        </div>
        {pendency.responsavel_id && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}
