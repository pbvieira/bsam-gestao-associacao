import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Package, FileText, ShoppingCart, Upload, BarChart3, CheckSquare } from "lucide-react";
import { useState } from "react";
import { TaskForm } from "@/components/tasks/task-form";
import { useToast } from "@/hooks/use-toast";

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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { toast } = useToast();

  const handleTaskCreated = () => {
    setIsTaskModalOpen(false);
    toast({
      title: "Tarefa criada com sucesso!",
      description: "A tarefa foi adicionada à lista.",
    });
  };

  return (
    <>
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Botão Nova Tarefa */}
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-muted/50"
              onClick={() => setIsTaskModalOpen(true)}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="text-center">
                <div className="font-medium text-sm">Nova Tarefa</div>
                <div className="text-xs text-muted-foreground">Criar nova tarefa</div>
              </div>
            </Button>

            {/* Outras ações rápidas */}
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

      {/* Modal de criação de tarefa */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm taskId={null} onSuccess={handleTaskCreated} />
        </DialogContent>
      </Dialog>
    </>
  );
}