import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useTasks } from "@/hooks/use-tasks";
import { useInventory } from "@/hooks/use-inventory";
import { useNotifications } from "@/hooks/use-notifications";
import { useQuickActions } from "@/hooks/use-quick-actions";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  Users, 
  FileText, 
  Target,
  Clock,
  MessageSquare,
  Package,
  AlertTriangle,
  Bell,
  TrendingUp,
  Zap
} from "lucide-react";

export function WorkspaceActions() {
  const { profile } = useAuth();
  const { tasks } = useTasks();
  const { items } = useInventory();
  const { notifications, unreadCount } = useNotifications();
  const { markLastTaskComplete, createQuickTask, createQuickEvent } = useQuickActions();

  // Calcular métricas contextuais
  const pendingTasks = tasks.filter(task => task.status === 'pendente').length;
  const lowStockItems = items.filter(item => item.estoque_atual <= item.estoque_minimo).length;
  const urgentNotifications = notifications.filter(n => n.type === 'reminder' && !n.read).length;

  // Ações inteligentes baseadas no contexto
  const getSmartActions = () => {
    const smartActions = [];

    // Ação para marcar última tarefa como concluída
    if (pendingTasks > 0) {
      smartActions.push({
        title: "Concluir Tarefa",
        description: `${pendingTasks} pendentes`,
        icon: CheckSquare,
        action: markLastTaskComplete,
        variant: "default" as const,
        color: "text-success",
        badge: pendingTasks
      });
    }

    // Ação para criar nova tarefa
    smartActions.push({
      title: "Nova Tarefa",
      description: "Criar rapidamente",
      icon: Plus,
      action: createQuickTask,
      variant: "outline" as const,
      color: "text-accent"
    });

    // Ação para verificar estoque baixo
    if (lowStockItems > 0) {
      smartActions.push({
        title: "Estoque Baixo",
        description: `${lowStockItems} itens críticos`,
        icon: AlertTriangle,
        href: "/estoque",
        variant: "outline" as const,
        color: "text-warning",
        badge: lowStockItems
      });
    }

    // Ação para agendar evento
    smartActions.push({
      title: "Agendar",
      description: "Novo compromisso",
      icon: Calendar,
      action: createQuickEvent,
      variant: "outline" as const,
      color: "text-accent"
    });

    return smartActions.slice(0, 4); // Máximo 4 ações
  };

  const smartActions = getSmartActions();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ações Inteligentes
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ações Inteligentes */}
        <div className="grid grid-cols-2 gap-2">
          {smartActions.map((action) => {
            const Icon = action.icon;
            const isAction = !!action.action;
            
            const ButtonComponent = (
              <Button
                variant={action.variant}
                size="sm"
                className="h-auto p-3 flex flex-col items-center gap-1.5 text-center min-w-0 relative hover:bg-transparent hover:text-inherit"
                onClick={isAction ? action.action : undefined}
              >
                <Icon className={`h-5 w-5 ${action.color} shrink-0`} />
                <div className="min-w-0 w-full">
                  <p className="font-medium text-xs truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>
                {action.badge && (
                  <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                    {action.badge}
                  </Badge>
                )}
              </Button>
            );

            return (
              <div key={action.title}>
                {isAction ? (
                  ButtonComponent
                ) : (
                  <Link to={action.href!}>
                    {ButtonComponent}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* Status Rápido */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Status Atual</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/30 rounded-lg p-2">
              <CheckSquare className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium">{pendingTasks}</p>
              <p className="text-xs text-muted-foreground">Tarefas</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <Package className="h-4 w-4 text-warning mx-auto mb-1" />
              <p className="text-xs font-medium">{lowStockItems}</p>
              <p className="text-xs text-muted-foreground">Baixo</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <Bell className="h-4 w-4 text-accent mx-auto mb-1" />
              <p className="text-xs font-medium">{unreadCount}</p>
              <p className="text-xs text-muted-foreground">Avisos</p>
            </div>
          </div>
        </div>

        {/* Acesso Rápido aos Módulos */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Acesso Direto</p>
          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs hover:bg-transparent" asChild>
              <Link to="/students">
                <Users className="h-3 w-3 mr-1" />
                Alunos
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
              <Link to="/estoque">
                <Package className="h-3 w-3 mr-1" />
                Estoque
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
              <Link to="/relatorios">
                <TrendingUp className="h-3 w-3 mr-1" />
                Relatórios
              </Link>
            </Button>
          </div>
        </div>

        {/* Insight do Sistema */}
        {(pendingTasks > 5 || lowStockItems > 0) && (
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3 border border-primary/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-primary">
                  ⚡ Atenção Necessária
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingTasks > 5 && `${pendingTasks} tarefas pendentes. `}
                  {lowStockItems > 0 && `${lowStockItems} itens com estoque baixo.`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}