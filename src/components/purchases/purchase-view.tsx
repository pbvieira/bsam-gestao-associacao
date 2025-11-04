import { usePurchaseItems } from "@/hooks/use-purchase-items";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Package, DollarSign, Calendar, User } from "lucide-react";
import { PurchaseWorkflow } from "./purchase-workflow";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseViewProps {
  order: any;
  onEdit: () => void;
  onUpdate: () => void;
}

export function PurchaseView({ order, onEdit, onUpdate }: PurchaseViewProps) {
  const { items } = usePurchaseItems(order.id);
  const { suppliers } = useSuppliers();

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.razao_social || "Fornecedor não encontrado";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "aprovado":
        return <Badge variant="default">Aprovado</Badge>;
      case "recebido":
        return <Badge variant="outline">Recebido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const stats = [
    {
      title: "Itens no Pedido",
      value: items.length,
      description: "Total de itens",
      icon: Package,
    },
    {
      title: "Quantidade Total",
      value: items.reduce((total, item) => total + item.quantidade, 0),
      description: "Unidades pedidas",
      icon: Package,
    },
    {
      title: "Valor Total",
      value: `R$ ${order.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      description: "Do pedido",
      icon: DollarSign,
    },
    {
      title: "Recebido",
      value: `${items.filter(item => item.quantidade_recebida > 0).length}/${items.length}`,
      description: "Itens recebidos",
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Workflow */}
      <PurchaseWorkflow order={order} onUpdate={onUpdate} />

      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Pedido {order.codigo_pedido}
                {getStatusBadge(order.status)}
              </CardTitle>
              <CardDescription>
                Detalhes completos do pedido de compra
              </CardDescription>
            </div>
            {order.status === "pendente" && (
              <Button onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Editar Pedido
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Fornecedor</p>
                <p className="text-sm text-muted-foreground">{getSupplierName(order.supplier_id)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data do Pedido</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.data_pedido), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            {order.data_aprovacao && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data Aprovação</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.data_aprovacao), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
            {order.data_recebimento && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Data Recebimento</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.data_recebimento), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
          </div>
          {order.observacoes && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Observações</p>
              <p className="text-sm text-muted-foreground">{order.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Pedido</CardTitle>
          <CardDescription>
            Lista completa de itens solicitados neste pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum item adicionado
              </h3>
              <p className="text-muted-foreground">
                Este pedido ainda não possui itens cadastrados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Recebido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome_item}</TableCell>
                    <TableCell>{item.descricao || "-"}</TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>
                      R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.quantidade_recebida >= item.quantidade ? "default" : "secondary"}>
                        {item.quantidade_recebida}/{item.quantidade}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}