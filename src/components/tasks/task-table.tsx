import { useState } from "react";
import { Task, TaskStatus, useTasks } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2, Play, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface TaskTableProps {
  tasks: Task[];
  onEditTask: (taskId: string) => void;
  onStatusChange?: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  pendente: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  em_andamento: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  realizada: "bg-green-100 text-green-800 hover:bg-green-100",
  cancelada: "bg-red-100 text-red-800 hover:bg-red-100",
  transferida: "bg-purple-100 text-purple-800 hover:bg-purple-100",
};

const statusLabels: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  realizada: "Realizada",
  cancelada: "Cancelada",
  transferida: "Transferida",
};

const priorityColors = {
  baixa: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  media: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  alta: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  urgente: "bg-red-100 text-red-800 hover:bg-red-100",
};

const priorityLabels = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export function TaskTable({ tasks, onEditTask, onStatusChange }: TaskTableProps) {
  const { updateTask, deleteTask } = useTasks();
  const { canAccess } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const canEditTask = canAccess('tasks');
  const canDeleteTask = canAccess('tasks');

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setLoading(taskId);
    try {
      const updates: Partial<Task> = { status: newStatus };
      if (newStatus === 'realizada') {
        updates.data_conclusao = new Date().toISOString();
      }
      
      const success = await updateTask(taskId, updates);
      if (success) {
        toast.success(`Status alterado para ${statusLabels[newStatus]}`);
        onStatusChange?.();
      }
    } catch (error) {
      toast.error('Erro ao alterar status');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (taskId: string) => {
    setLoading(taskId);
    try {
      await deleteTask(taskId);
      toast.success('Tarefa excluída com sucesso');
      onStatusChange?.();
    } catch (error) {
      toast.error('Erro ao excluir tarefa');
    } finally {
      setLoading(null);
    }
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Título</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[150px]">Responsável</TableHead>
            <TableHead className="w-[120px]">Vencimento</TableHead>
            <TableHead className="w-[140px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">
                <div className="max-w-[280px] truncate" title={task.titulo}>
                  {task.titulo}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[task.status]} variant="secondary">
                  {statusLabels[task.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColors[task.prioridade]} variant="secondary">
                  {priorityLabels[task.prioridade]}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {task.assigned_to_profile?.full_name || 'Não atribuído'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {task.data_vencimento
                    ? format(new Date(task.data_vencimento), 'dd/MM/yyyy', { locale: ptBR })
                    : '-'
                  }
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {canEditTask && (
                    <>
                      {task.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStatusChange(task.id, 'em_andamento')}
                          disabled={loading === task.id}
                          title="Iniciar"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {task.status === 'em_andamento' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStatusChange(task.id, 'realizada')}
                          disabled={loading === task.id}
                          title="Concluir"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(task.status === 'pendente' || task.status === 'em_andamento') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStatusChange(task.id, 'cancelada')}
                          disabled={loading === task.id}
                          title="Cancelar"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEditTask(task.id)}
                        disabled={loading === task.id}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {canDeleteTask && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={loading === task.id}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a tarefa "{task.titulo}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(task.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
