import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Package, TrendingUp } from "lucide-react";

export function StatsCards() {
  const stats = [
    {
      title: "Total de Alunos",
      value: "127",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Alunos Ativos",
      value: "98",
      change: "+5%",
      trend: "up",
      icon: UserCheck,
      color: "text-success",
    },
    {
      title: "Itens em Estoque",
      value: "2.456",
      change: "-8%",
      trend: "down",
      icon: Package,
      color: "text-warning",
    },
    {
      title: "Gastos do Mês",
      value: "R$ 15.890",
      change: "+23%",
      trend: "up",
      icon: TrendingUp,
      color: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${
                stat.trend === 'up' ? 'text-success' : 'text-danger'
              }`}>
                {stat.change} em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}