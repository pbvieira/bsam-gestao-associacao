import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task, useTasks } from "@/hooks/use-tasks";
import { Clock, User, Edit, Trash2, Check, X, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onStatusChange?: () => void;
}

export function TaskCard({ task, onEdit, onStatusChange }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasks();
  const { user, hasCapability } = useAuth();
  const [loading, setLoading] = useState(false);

  const canEditTask =
    task.created_by === user?.id || task.assigned_to === user?.id || hasCapability("tasks.write");
  const canDeleteTask = task.created_by === user?.id || hasCapability("tasks.delete");

  const priorityBorder = {
    baixa: "border-l-success",
    media: "border-l-warning",
    alta: "border-l-danger",
    urgente: "border-l-destructive",
  };

  const priorityBadge = {
    baixa: "bg-success/10 text-success-foreground border-success/20",
    media: "bg-warning/10 text-warning-foreground border-warning/20",
    alta: "bg-danger/10 text-danger-foreground border-danger/20",
    urgente: "bg-destructive/10 text-destructive-foreground border-destructive/20",
  };

  const statusColors = {
    pendente: "bg-warning/10 text-warning-foreground border-warning/20",
    em_andamento: "bg-primary text-primary-foreground border-primary",
    realizada: "bg-success text-success-foreground border-success",
    cancelada: "bg-muted text-muted-foreground border-border",
    transferida: "bg-accent/10 text-accent-foreground border-accent/20",
  };

  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    realizada: "Realizada",
    cancelada: "Cancelada",
    transferida: "Transferida",
  };

  const priorityLabels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  const handleStatusChange = async (newStatus: Task["status"]) => {
    setLoading(true);
    try {
      await updateTask(task.id, {
        status: newStatus,
        data_conclusao: newStatus === "realizada" ? new Date().toISOString() : null,
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    } finally {
      setLoading(false);
    }
  };

  const isActive = task.status !== "realizada" && task.status !== "cancelada";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md w-full border-l-4",
        priorityBorder[task.prioridade],
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm leading-tight truncate">{task.titulo}</h3>
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5", priorityBadge[task.prioridade])}>
              {priorityLabels[task.prioridade]}
            </Badge>
            <Badge variant="outline" className={cn("text-xs px-1.5 py-0 h-5", statusColors[task.status])}>
              {statusLabels[task.status]}
            </Badge>
            {task.categoria && (
              <Badge variant="accent" className="text-xs px-1.5 py-0 h-5 font-medium">
                {task.categoria}
              </Badge>
            )}
          </div>
          {task.descricao && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{task.descricao}</p>
          )}
        </div>

        {/* Meta: responsável + data */}
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-1 max-w-[140px]">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{task.assigned_to_profile?.full_name || "Não atribuído"}</span>
          </div>
          {task.data_vencimento && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {formatDistanceToNow(new Date(task.data_vencimento), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-0.5 shrink-0">
          {canEditTask && isActive && task.status === "pendente" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleStatusChange("em_andamento")}
              disabled={loading}
              title="Iniciar"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {canEditTask && isActive && task.status === "em_andamento" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-success"
              onClick={() => handleStatusChange("realizada")}
              disabled={loading}
              title="Concluir"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          {canEditTask && isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground"
              onClick={() => handleStatusChange("cancelada")}
              disabled={loading}
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          {canEditTask && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onEdit}
              disabled={loading}
              title="Editar"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          {canDeleteTask && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  disabled={loading}
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir a tarefa "{task.titulo}"? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </Card>
  );
}
