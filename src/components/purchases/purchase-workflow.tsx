import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  XCircle,
  ArrowRight
} from "lucide-react";
import { usePurchases } from "@/hooks/use-purchases";
import { usePurchaseItems } from "@/hooks/use-purchase-items";
import { useInventory } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseWorkflowProps {
  order: any;
  onUpdate: () => void;
}

export function PurchaseWorkflow({ order, onUpdate }: PurchaseWorkflowProps) {
  const { approveOrder, receiveOrder, updateOrder } = usePurchases();
  const { items } = usePurchaseItems(order.id);
  const { createMovement } = useInventory();
  const { canAccess, user } = useAuth();
  const { toast } = useToast();

  const canApprove = canAccess('purchases');
  const canReceive = canAccess('purchases');

  const handleApprove = async () => {
    const { error } = await approveOrder(order.id);
    
    if (error) {
      toast({
        title: "Erro ao aprovar",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pedido aprovado",
        description: "O pedido foi aprovado com sucesso e está pronto para recebimento.",
      });
      onUpdate();
    }
  };

  const handleReceive = async () => {
    // Verificar se há itens no pedido
    if (items.length === 0) {
      toast({
        title: "Erro ao receber",
        description: "O pedido não possui itens cadastrados.",
        variant: "destructive",
      });
      return;
    }

    // Marcar pedido como recebido
    const { error: receiveError } = await receiveOrder(order.id);
    
    if (receiveError) {
      toast({
        title: "Erro ao receber",
        description: receiveError,
        variant: "destructive",
      });
      return;
    }

    // Criar movimentações de entrada no estoque para cada item
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      if (item.inventory_item_id) {
        const { error: movementError } = await createMovement({
          inventory_item_id: item.inventory_item_id,
          tipo_movimento: 'entrada',
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          origem_movimento: 'compra',
          referencia_id: order.id,
          referencia_tipo: 'purchase_order',
          observacoes: `Recebimento do pedido ${order.codigo_pedido}`,
          data_movimento: new Date().toISOString().split('T')[0],
        });

        if (movementError) {
          errorCount++;
          console.error(`Erro ao criar movimentação para item ${item.nome_item}:`, movementError);
        } else {
          successCount++;
        }
      }
    }

    if (errorCount > 0) {
      toast({
        title: "Recebimento parcial",
        description: `${successCount} itens foram adicionados ao estoque, mas ${errorCount} itens falharam.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pedido recebido",
        description: `O pedido foi recebido com sucesso e ${successCount} itens foram adicionados ao estoque.`,
      });
    }

    onUpdate();
  };

  const handleCancel = async () => {
    const { error } = await updateOrder(order.id, { status: 'cancelado' });
    
    if (error) {
      toast({
        title: "Erro ao cancelar",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pedido cancelado",
        description: "O pedido foi cancelado com sucesso.",
      });
      onUpdate();
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pendente':
        return {
          icon: Clock,
          label: 'Pendente',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          description: 'Aguardando aprovação'
        };
      case 'aprovado':
        return {
          icon: CheckCircle2,
          label: 'Aprovado',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          description: 'Aguardando recebimento'
        };
      case 'recebido':
        return {
          icon: Package,
          label: 'Recebido',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          description: 'Recebido e adicionado ao estoque'
        };
      case 'cancelado':
        return {
          icon: XCircle,
          label: 'Cancelado',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          description: 'Pedido cancelado'
        };
      default:
        return {
          icon: Clock,
          label: status,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          description: ''
        };
    }
  };

  const currentStatus = getStatusConfig(order.status);
  const CurrentIcon = currentStatus.icon;

  const workflowSteps = [
    { status: 'pendente', label: 'Pendente', completed: true },
    { status: 'aprovado', label: 'Aprovado', completed: ['aprovado', 'recebido'].includes(order.status) },
    { status: 'recebido', label: 'Recebido', completed: order.status === 'recebido' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do Pedido</CardTitle>
        <CardDescription>Acompanhe o fluxo de aprovação e recebimento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className={`flex items-center gap-4 p-4 rounded-lg ${currentStatus.bgColor}`}>
          <CurrentIcon className={`h-8 w-8 ${currentStatus.color}`} />
          <div className="flex-1">
            <h3 className="font-semibold">{currentStatus.label}</h3>
            <p className="text-sm text-muted-foreground">{currentStatus.description}</p>
          </div>
          <Badge variant="outline">{currentStatus.label}</Badge>
        </div>

        {/* Workflow Steps */}
        {order.status !== 'cancelado' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-4">Progresso do Pedido</h4>
            <div className="flex items-center justify-between">
              {workflowSteps.map((step, index) => (
                <div key={step.status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs mt-2 text-center">{step.label}</span>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <ArrowRight className={`h-4 w-4 mx-2 ${
                      workflowSteps[index + 1].completed 
                        ? 'text-primary' 
                        : 'text-muted-foreground'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Data do Pedido</p>
            <p className="text-sm">
              {format(new Date(order.data_pedido), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          {order.data_aprovacao && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Aprovação</p>
              <p className="text-sm">
                {format(new Date(order.data_aprovacao), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
          {order.data_recebimento && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Recebimento</p>
              <p className="text-sm">
                {format(new Date(order.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {order.status === 'pendente' && canApprove && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar Pedido
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Aprovar pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja aprovar o pedido "{order.codigo_pedido}"? 
                      Após a aprovação, o pedido estará pronto para recebimento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleApprove}>
                      Aprovar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar pedido?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar o pedido "{order.codigo_pedido}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-destructive">
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {order.status === 'aprovado' && canReceive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="flex-1">
                  <Package className="h-4 w-4 mr-2" />
                  Confirmar Recebimento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar recebimento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ao confirmar o recebimento do pedido "{order.codigo_pedido}", 
                    todos os itens vinculados ao estoque serão automaticamente adicionados 
                    com entrada de estoque. Deseja continuar?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReceive}>
                    Confirmar Recebimento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {order.status === 'recebido' && (
            <div className="flex-1 p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Pedido recebido em {format(new Date(order.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}

          {order.status === 'cancelado' && (
            <div className="flex-1 p-3 bg-destructive/10 rounded-lg text-center">
              <p className="text-sm text-destructive">
                Pedido cancelado
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
