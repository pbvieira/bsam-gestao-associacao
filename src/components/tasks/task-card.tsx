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

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  variant?: 'list' | 'board';
  onStatusChange?: () => void;
}

export function TaskCard({ task, onEdit, variant = 'list', onStatusChange }: TaskCardProps) {
  const { updateTask, deleteTask } = useTasks();
  const { user, canAccess } = useAuth();
  const [loading, setLoading] = useState(false);

  const canEditTask = task.created_by === user?.id || task.assigned_to === user?.id || canAccess('tasks');
  const canDeleteTask = task.created_by === user?.id || canAccess('tasks');
  const isBoard = variant === 'board';

  const priorityColors = {
    baixa: "bg-success/10 text-success-foreground border-success/20",
    media: "bg-warning/10 text-warning-foreground border-warning/20", 
    alta: "bg-danger/10 text-danger-foreground border-danger/20",
    urgente: "bg-destructive/10 text-destructive-foreground border-destructive/20"
  };

  const statusColors = {
    pendente: "bg-warning/10 text-warning-foreground border-warning/20",
    em_andamento: "bg-primary/10 text-primary-foreground border-primary/20",
    realizada: "bg-success text-success-foreground border-success",
    cancelada: "bg-muted text-muted-foreground border-border",
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
      
      // Aguardar um momento para garantir que o banco foi atualizado
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Resetar filtros e forçar recarregamento após mudança de status
      if (onStatusChange) {
        onStatusChange();
      }
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
    <Card className="transition-all hover:shadow-md w-full">
      <CardContent className={isBoard ? "p-3" : "p-4"}>
        <div className={`space-y-${isBoard ? '2' : '3'}`}>
          {/* Header com título e prioridade */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium leading-tight line-clamp-2 ${
                isBoard ? 'text-sm' : 'text-base'
              }`}>
                {task.titulo}
              </h3>
            </div>
            <div className="flex gap-1 shrink-0">
              <Badge variant="outline" className={`${priorityColors[task.prioridade]} ${
                isBoard ? 'text-xs px-1.5 py-0.5' : ''
              }`}>
                {isBoard ? priorityLabels[task.prioridade].charAt(0) : priorityLabels[task.prioridade]}
              </Badge>
            </div>
          </div>

          {/* Status e categoria */}
          <div className="flex items-center gap-1 flex-wrap">
            <Badge variant="outline" className={`${statusColors[task.status]} ${
              isBoard ? 'text-xs px-1.5 py-0.5' : ''
            }`}>
              {isBoard ? statusLabels[task.status].split(' ')[0] : statusLabels[task.status]}
            </Badge>
            {task.categoria && !isBoard && (
              <Badge variant="secondary" className="text-xs">
                {task.categoria}
              </Badge>
            )}
          </div>

          {/* Descrição - mais compacta no board */}
          {task.descricao && (
            <p className={`text-muted-foreground line-clamp-${isBoard ? '1' : '2'} ${
              isBoard ? 'text-xs' : 'text-sm'
            }`}>
              {task.descricao}
            </p>
          )}

          {/* Responsável e Data */}
          <div className={`text-muted-foreground ${
            isBoard ? 'text-xs space-y-1' : 'text-sm'
          }`}>
            <div className="flex items-center gap-1">
              <User className={`${isBoard ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className="truncate">
                {isBoard 
                  ? (task.assigned_to_profile?.full_name?.split(' ')[0] || 'N/A') 
                  : (task.assigned_to_profile?.full_name || 'Não atribuído')
                }
              </span>
            </div>
            {task.data_vencimento && (
              <div className="flex items-center gap-1">
                <Clock className={`${isBoard ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span className="truncate">
                  {isBoard 
                    ? formatDistanceToNow(new Date(task.data_vencimento), { locale: ptBR })
                    : `Vence ${formatDistanceToNow(new Date(task.data_vencimento), { addSuffix: true, locale: ptBR })}`
                  }
                </span>
              </div>
            )}
          </div>

          {/* Ações - layout otimizado por variante */}
          <div className={`flex items-center justify-between ${
            isBoard ? 'pt-1 border-t' : 'pt-2 border-t'
          }`}>
            {isBoard ? (
              // Layout compacto para board
              <div className="flex gap-0.5 w-full justify-between">
                <div className="flex gap-0.5">
                  {/* Ação rápida principal */}
                  {canEditTask && task.status === 'pendente' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs"
                      onClick={() => handleStatusChange('em_andamento')}
                      disabled={loading}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                  {canEditTask && task.status === 'em_andamento' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs"
                      onClick={() => handleStatusChange('realizada')}
                      disabled={loading}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex gap-0.5">
                  {canEditTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5"
                      onClick={onEdit}
                      disabled={loading}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  {canDeleteTask && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-destructive hover:text-destructive"
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
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
            ) : (
              // Layout completo para lista
              <>
                <div className="flex gap-1">
                  {canEditTask && task.status !== 'realizada' && task.status !== 'cancelada' && (
                    <>
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
                    </>
                  )}
                </div>
                
                <div className="flex gap-1">
                  {canEditTask && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
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
                          className="h-8 w-8 p-0"
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
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}