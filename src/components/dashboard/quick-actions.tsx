import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Package, FileText, ShoppingCart, Upload, BarChart3 } from "lucide-react";

const quickActions = [
  {
    title: "Novo Aluno",
    description: "Cadastrar novo assistido",
    icon: UserPlus,
    href: "/alunos/novo",
    color: "bg-primary text-primary-foreground",
  },
  {
    title: "Entrada Estoque",
    description: "Registrar doação/compra",
    icon: Package,
    href: "/estoque/entrada",
    color: "bg-success text-success-foreground",
  },
  {
    title: "Nova Anotação",
    description: "Registrar atendimento",
    icon: FileText,
    href: "/alunos/anotacao",
    color: "bg-warning text-warning-foreground",
  },
  {
    title: "Nova Compra",
    description: "Criar ordem de compra",
    icon: ShoppingCart,
    href: "/compras/nova",
    color: "bg-accent text-accent-foreground",
  },
  {
    title: "Upload Arquivo",
    description: "Enviar documentos",
    icon: Upload,
    href: "/documentos/upload",
    color: "bg-muted text-muted-foreground",
  },
  {
    title: "Relatórios",
    description: "Gerar relatórios",
    icon: BarChart3,
    href: "/relatorios",
    color: "bg-danger text-danger-foreground",
  },
];

export function QuickActions() {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
                asChild
              >
                <a href={action.href}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </a>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}