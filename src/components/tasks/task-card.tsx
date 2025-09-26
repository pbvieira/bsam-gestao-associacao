import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task, useTasks } from "@/hooks/use-tasks";
import { Clock, User, Edit, Trash2, Check, X, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasks();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);

  const canEditTask = task.created_by === user?.id || task.assigned_to === user?.id || hasPermission('tasks', 'update');
  const canDeleteTask = task.created_by === user?.id || hasPermission('tasks', 'delete');

  const priorityColors = {
    baixa: "bg-success/10 text-success-foreground border-success/20",
    media: "bg-warning/10 text-warning-foreground border-warning/20", 
    alta: "bg-danger/10 text-danger-foreground border-danger/20",
    urgente: "bg-destructive/10 text-destructive-foreground border-destructive/20"
  };

  const statusColors = {
    pendente: "bg-muted text-muted-foreground",
    em_andamento: "bg-primary/10 text-primary-foreground border-primary/20",
    realizada: "bg-success/10 text-success-foreground border-success/20",
    cancelada: "bg-muted text-muted-foreground",
    transferida: "bg-accent/10 text-accent-foreground border-accent/20"
  };

  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    realizada: "Realizada",
    cancelada: "Cancelada",
    transferida: "Transferida"
  };

  const priorityLabels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta", 
    urgente: "Urgente"
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    setLoading(true);
    try {
      await updateTask(task.id, { 
        status: newStatus,
        data_conclusao: newStatus === 'realizada' ? new Date().toISOString() : null
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{task.titulo}</h3>
              <Badge className={priorityColors[task.prioridade]}>
                {priorityLabels[task.prioridade]}
              </Badge>
              <Badge variant="outline" className={statusColors[task.status]}>
                {statusLabels[task.status]}
              </Badge>
              {task.categoria && (
                <Badge variant="secondary">{task.categoria}</Badge>
              )}
            </div>
            
            {task.descricao && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.descricao}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {canEditTask && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={loading}
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
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
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
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Informações da tarefa */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Responsável: {task.assigned_to_profile?.full_name || 'Não atribuído'}</span>
            </div>
            
            {task.data_vencimento && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  Vence {formatDistanceToNow(new Date(task.data_vencimento), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          {canEditTask && task.status !== 'realizada' && task.status !== 'cancelada' && (
            <div className="flex items-center gap-2 pt-2 border-t">
              {task.status === 'pendente' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('em_andamento')}
                  disabled={loading}
                  className="h-8"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Iniciar
                </Button>
              )}
              
              {task.status === 'em_andamento' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange('realizada')}
                  disabled={loading}
                  className="h-8"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Concluir
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('cancelada')}
                disabled={loading}
                className="h-8"
              >
                <X className="w-3 h-3 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}