import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  AlertCircle, 
  ShoppingCart, 
  Package,
  Mail,
  Bell,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'purchase_pending' | 'purchase_approved';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  item_id?: string;
  item_name?: string;
  current_stock?: number;
  min_stock?: number;
  purchase_id?: string;
  purchase_code?: string;
  created_at: string;
}

export function InventoryAlerts() {
  const { user } = useAuth();

  // Fetch low stock items
  const { data: lowStockItems = [], isLoading: loadingStock } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, nome, estoque_atual, estoque_minimo, categoria')
        .eq('ativo', true)
        .filter('estoque_atual', 'lte', 'estoque_minimo')
        .order('estoque_atual', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch pending purchase orders
  const { data: pendingPurchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ['pending-purchases-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, codigo_pedido, data_pedido, valor_total, suppliers(razao_social)')
        .eq('status', 'pendente')
        .order('data_pedido', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch approved purchase orders awaiting receipt
  const { data: approvedPurchases = [], isLoading: loadingApproved } = useQuery({
    queryKey: ['approved-purchases-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, codigo_pedido, data_aprovacao, valor_total, suppliers(razao_social)')
        .eq('status', 'aprovado')
        .order('data_aprovacao', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const handleSendEmailAlerts = async () => {
    try {
      // Call edge function to send email alerts
      const { error } = await supabase.functions.invoke('send-inventory-alerts', {
        body: {
          user_id: user?.id,
          low_stock_count: lowStockItems.length,
          out_of_stock_count: lowStockItems.filter(i => i.estoque_atual === 0).length,
          pending_purchases_count: pendingPurchases.length,
        }
      });

      if (error) throw error;

      toast.success("E-mails de alerta enviados com sucesso!");
    } catch (error: any) {
      console.error('Error sending alerts:', error);
      toast.error("Erro ao enviar e-mails de alerta: " + error.message);
    }
  };

  const criticalAlerts = lowStockItems.filter(i => i.estoque_atual === 0);
  const warningAlerts = lowStockItems.filter(i => i.estoque_atual > 0 && i.estoque_atual <= i.estoque_minimo);

  const isLoading = loadingStock || loadingPurchases || loadingApproved;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalAlerts = criticalAlerts.length + warningAlerts.length + pendingPurchases.length + approvedPurchases.length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Central de Alertas</h3>
          <p className="text-sm text-muted-foreground">
            {totalAlerts} {totalAlerts === 1 ? 'alerta ativo' : 'alertas ativos'}
          </p>
        </div>
        {totalAlerts > 0 && (
          <Button onClick={handleSendEmailAlerts} variant="outline" className="gap-2">
            <Mail className="h-4 w-4" />
            Enviar Resumo por E-mail
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Zerado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Crítico</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{warningAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{pendingPurchases.length}</div>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Recebimento</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{approvedPurchases.length}</div>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts - Out of Stock */}
      {criticalAlerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Itens com Estoque Zerado</CardTitle>
            </div>
            <CardDescription>
              {criticalAlerts.length} {criticalAlerts.length === 1 ? 'item crítico necessita' : 'itens críticos necessitam'} reposição imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalAlerts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      {item.categoria ? (
                        <Badge variant="secondary">{item.categoria}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{item.estoque_minimo}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Zerado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts - Low Stock */}
      {warningAlerts.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-yellow-500">Itens com Estoque Baixo</CardTitle>
            </div>
            <CardDescription>
              {warningAlerts.length} {warningAlerts.length === 1 ? 'item está' : 'itens estão'} abaixo do nível mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque Atual</TableHead>
                  <TableHead>Estoque Mínimo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warningAlerts.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      {item.categoria ? (
                        <Badge variant="secondary">{item.categoria}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{item.estoque_atual}</TableCell>
                    <TableCell>{item.estoque_minimo}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                        Estoque Baixo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pending Purchase Orders */}
      {pendingPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <CardTitle>Pedidos Aguardando Aprovação</CardTitle>
            </div>
            <CardDescription>
              {pendingPurchases.length} {pendingPurchases.length === 1 ? 'pedido aguarda' : 'pedidos aguardam'} aprovação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data do Pedido</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPurchases.map((purchase: any) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono">{purchase.codigo_pedido}</TableCell>
                    <TableCell>{purchase.suppliers?.razao_social || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(purchase.data_pedido), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      R$ {purchase.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pendente</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved Purchase Orders */}
      {approvedPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              <CardTitle>Pedidos Aguardando Recebimento</CardTitle>
            </div>
            <CardDescription>
              {approvedPurchases.length} {approvedPurchases.length === 1 ? 'pedido aguarda' : 'pedidos aguardam'} recebimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data de Aprovação</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedPurchases.map((purchase: any) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono">{purchase.codigo_pedido}</TableCell>
                    <TableCell>{purchase.suppliers?.razao_social || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(purchase.data_aprovacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      R$ {purchase.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge>Aprovado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Alerts */}
      {totalAlerts === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tudo em ordem!</h3>
            <p className="text-muted-foreground text-center">
              Não há alertas ativos no momento. O estoque está controlado e todos os pedidos foram processados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
