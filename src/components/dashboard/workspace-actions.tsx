import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  Users, 
  FileText, 
  Target,
  Clock,
  MessageSquare
} from "lucide-react";

export function WorkspaceActions() {
  const { profile } = useAuth();

  const getActionsForRole = () => {
    const baseActions = [
      {
        title: "Nova Tarefa",
        description: "Criar uma tarefa rápida",
        icon: Plus,
        href: "/tarefas",
        variant: "default" as const,
        color: "text-primary"
      },
      {
        title: "Agendar",
        description: "Criar novo compromisso",
        icon: Calendar,
        href: "/calendario",
        variant: "secondary" as const,
        color: "text-accent"
      }
    ];

    const advancedActions = [];

    if (profile?.role === 'diretor' || profile?.role === 'coordenador') {
      advancedActions.push({
        title: "Delegar Tarefa",
        description: "Atribuir tarefa à equipe",
        icon: Target,
        href: "/tarefas",
        variant: "outline" as const,
        color: "text-warning"
      });
    }

    if (profile?.role !== 'aluno') {
      advancedActions.push({
        title: "Reunião Rápida",
        description: "Agendar reunião urgente",
        icon: MessageSquare,
        href: "/calendario",
        variant: "outline" as const,
        color: "text-success"
      });
    }

    return [...baseActions, ...advancedActions];
  };

  const quickStats = [
    {
      title: "Ver Agenda",
      description: "Próximos compromissos",
      icon: Clock,
      href: "/calendario",
      color: "text-muted-foreground"
    }
  ];

  const actions = getActionsForRole();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ações Principais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                size="sm"
                className="h-auto p-3 flex flex-col items-center gap-1.5 text-center min-w-0"
                asChild
              >
                <Link to={action.href}>
                  <Icon className={`h-5 w-5 ${action.color} shrink-0`} />
                  <div className="min-w-0 w-full">
                    <p className="font-medium text-xs truncate">{action.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Ações Contextuais */}
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Acesso Rápido</p>
          <div className="flex flex-wrap gap-2">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Button
                  key={stat.title}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-2 flex items-center gap-2 min-w-0"
                  asChild
                >
                  <Link to={stat.href}>
                    <Icon className={`h-4 w-4 ${stat.color} shrink-0`} />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-medium truncate">{stat.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.description}
                      </p>
                    </div>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Dica do Dia */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                💡 Dica de Produtividade
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Organize suas tarefas por prioridade e estabeleça horários específicos para cada atividade.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}