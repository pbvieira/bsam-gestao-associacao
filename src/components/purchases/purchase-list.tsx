import { useState } from "react";
import { usePurchases } from "@/hooks/use-purchases";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, Eye, ShoppingCart, DollarSign, Package, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PurchaseListProps {
  onCreateOrder: () => void;
  onEditOrder: (order: any) => void;
  onViewOrder: (order: any) => void;
}

export function PurchaseList({ onCreateOrder, onEditOrder, onViewOrder }: PurchaseListProps) {
  const { orders, loading, approveOrder, receiveOrder } = usePurchases();
  const { suppliers } = useSuppliers();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");

  const handleApprove = async (order: any) => {
    if (window.confirm(`Tem certeza que deseja aprovar o pedido "${order.codigo_pedido}"?`)) {
      const { error } = await approveOrder(order.id);
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Pedido aprovado com sucesso",
        });
      }
    }
  };

  const handleReceive = async (order: any) => {
    if (window.confirm(`Tem certeza que deseja marcar o pedido "${order.codigo_pedido}" como recebido?`)) {
      const { error } = await receiveOrder(order.id);
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Pedido marcado como recebido",
        });
      }
    }
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.razao_social || "Fornecedor não encontrado";
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = 
        order.codigo_pedido.toLowerCase().includes(search.toLowerCase()) ||
        getSupplierName(order.supplier_id).toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "codigo_pedido":
          return a.codigo_pedido.localeCompare(b.codigo_pedido);
        case "status":
          return a.status.localeCompare(b.status);
        case "valor_total":
          return b.valor_total - a.valor_total;
        case "created_at":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

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
      title: "Total Pedidos",
      value: orders.length,
      description: "Pedidos cadastrados",
      icon: ShoppingCart,
    },
    {
      title: "Pendentes",
      value: orders.filter(o => o.status === "pendente").length,
      description: "Aguardando aprovação",
      icon: Clock,
    },
    {
      title: "Aprovados",
      value: orders.filter(o => o.status === "aprovado").length,
      description: "Aprovados para recebimento",
      icon: Package,
    },
    {
      title: "Valor Total",
      value: `R$ ${orders.reduce((total, order) => total + order.valor_total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      description: "Em pedidos cadastrados",
      icon: DollarSign,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos de Compra</CardTitle>
          <CardDescription>
            Gerencie os pedidos de compra da sua organização
          </CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por código ou fornecedor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Data de Criação</SelectItem>
                <SelectItem value="codigo_pedido">Código</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="valor_total">Valor Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {search || statusFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhum pedido cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece criando seu primeiro pedido de compra"
                }
              </p>
              {(!search && statusFilter === "all") && (
                <Button onClick={onCreateOrder}>
                  Criar Primeiro Pedido
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.codigo_pedido}
                    </TableCell>
                    <TableCell>
                      {getSupplierName(order.supplier_id)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.data_pedido), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      R$ {order.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === "pendente" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditOrder(order)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(order)}
                            >
                              Aprovar
                            </Button>
                          </>
                        )}
                        {order.status === "aprovado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReceive(order)}
                          >
                            Receber
                          </Button>
                        )}
                      </div>
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