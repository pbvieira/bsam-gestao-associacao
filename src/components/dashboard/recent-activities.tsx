import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const activities = [
  {
    id: 1,
    type: "entrada",
    message: "Novo aluno cadastrado: João Silva",
    time: "2 horas atrás",
    user: "Maria Santos",
    status: "success",
  },
  {
    id: 2,
    type: "atendimento",
    message: "Atendimento psicológico realizado para Pedro Costa",
    time: "4 horas atrás",
    user: "Dr. Carlos Lima",
    status: "info",
  },
  {
    id: 3,
    type: "estoque",
    message: "Doação recebida: 50 cestas básicas",
    time: "6 horas atrás",
    user: "Ana Oliveira",
    status: "success",
  },
  {
    id: 4,
    type: "saida",
    message: "Entrega de medicamentos para José Fernandes",
    time: "1 dia atrás",
    user: "Rita Souza",
    status: "warning",
  },
  {
    id: 5,
    type: "compra",
    message: "Compra aprovada: Material de limpeza - R$ 450,00",
    time: "1 dia atrás",
    user: "Diretor Paulo",
    status: "info",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "bg-success text-success-foreground";
    case "warning":
      return "bg-warning text-warning-foreground";
    case "info":
      return "bg-primary text-primary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export function RecentActivities() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">
                  {activity.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    por {activity.user}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              </div>

              <Badge 
                variant="secondary" 
                className={`text-xs ${getStatusColor(activity.status)}`}
              >
                {activity.type}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}