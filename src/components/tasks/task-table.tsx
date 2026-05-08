import { useState } from "react";
import { Task, TaskStatus, useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Play, CheckCircle, XCircle } from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (taskId: string) => void;
  onStatusChange?: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  pendente: "bg-warning/10 text-warning-foreground border-warning/20",
  em_andamento: "bg-primary text-primary-foreground border-primary",
  realizada: "bg-success text-success-foreground border-success",
  cancelada: "bg-muted text-muted-foreground border-border",
  transferida: "bg-accent/10 text-accent-foreground border-accent/20",
};

const statusLabels: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  realizada: "Realizada",
  cancelada: "Cancelada",
  transferida: "Transferida",
};

const priorityColors = {
  baixa: "bg-success/10 text-success-foreground border-success/20",
  media: "bg-warning/10 text-warning-foreground border-warning/20",
  alta: "bg-danger/10 text-danger-foreground border-danger/20",
  urgente: "bg-destructive/10 text-destructive-foreground border-destructive/20",
};

const priorityLabels = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };

const isOverdue = (task: Task) =>
  !!task.data_vencimento &&
  task.status !== "realizada" &&
  task.status !== "cancelada" &&
  task.status !== "transferida" &&
  isBefore(new Date(task.data_vencimento), startOfDay(new Date()));

export function TaskTable({ tasks, onEditTask, onStatusChange }: TaskTableProps) {
  const { updateTask, deleteTask } = useTasks();
  const { user, hasCapability } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const canEditTask = (task: Task) =>
    task.created_by === user?.id || task.assigned_to === user?.id || hasCapability("tasks.write");
  const canDeleteTask = (task: Task) =>
    task.created_by === user?.id || hasCapability("tasks.delete");

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setLoading(taskId);
    try {
      const updates: Partial<Task> = { status: newStatus };
      if (newStatus === "realizada") updates.data_conclusao = new Date().toISOString();
      const ok = await updateTask(taskId, updates);
      if (ok) onStatusChange?.();
    } catch {
      toast.error("Erro ao alterar status");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    setLoading(taskId);
    try {
      await deleteTask(taskId);
      onStatusChange?.();
    } catch {
      // toast já tratado
    } finally {
      setLoading(null);
    }
  };

  if (tasks.length === 0) return null;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Título</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[150px]">Responsável</TableHead>
            <TableHead className="w-[140px]">Vencimento</TableHead>
            <TableHead className="w-[140px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            const editable = canEditTask(task);
            const deletable = canDeleteTask(task);
            const isActive = task.status === "pendente" || task.status === "em_andamento";
            return (
              <TableRow key={task.id} className={cn(overdue && "bg-destructive/5")}>
                <TableCell className="font-medium">
                  <div className="max-w-[280px] truncate" title={task.titulo}>{task.titulo}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge className={statusColors[task.status]} variant="outline">
                      {statusLabels[task.status]}
                    </Badge>
                    {overdue && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-[10px]">
                        ATRASADA
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={priorityColors[task.prioridade]} variant="outline">
                    {priorityLabels[task.prioridade]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {task.assigned_to_profile?.full_name || "Não atribuído"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={cn("text-sm", overdue && "text-destructive font-medium")}>
                    {task.data_vencimento
                      ? format(new Date(task.data_vencimento), "dd/MM/yyyy", { locale: ptBR })
                      : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {editable && isActive && task.status === "pendente" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => handleStatusChange(task.id, "em_andamento")}
                        disabled={loading === task.id} title="Iniciar">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    {editable && isActive && task.status === "em_andamento" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success"
                        onClick={() => handleStatusChange(task.id, "realizada")}
                        disabled={loading === task.id} title="Concluir">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {editable && isActive && (
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => handleStatusChange(task.id, "cancelada")}
                        disabled={loading === task.id} title="Cancelar">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {editable && (
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => onEditTask(task.id)}
                        disabled={loading === task.id} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {deletable && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            disabled={loading === task.id} title="Excluir">
                            <Trash2 className="h-4 w-4" />
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
                              onClick={() => handleDelete(task.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
