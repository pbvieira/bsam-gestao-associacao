import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, ShoppingCart, DollarSign, Search, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PurchaseReportData {
  id: string;
  codigo_pedido: string;
  data_pedido: string;
  status: string;
  valor_total: number;
  supplier_name: string;
  data_aprovacao: string | null;
  data_recebimento: string | null;
  items_count: number;
}

export function PurchasesReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, razao_social')
        .eq('ativo', true)
        .order('razao_social');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['purchases-report', startDate, endDate, statusFilter, supplierFilter],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers!inner(razao_social)
        `);

      if (startDate) {
        query = query.gte('data_pedido', startDate);
      }
      if (endDate) {
        query = query.lte('data_pedido', endDate);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (supplierFilter !== 'all') {
        query = query.eq('supplier_id', supplierFilter);
      }

      query = query.order('data_pedido', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Get items count for each purchase
      const purchasesWithItems = await Promise.all(
        (data || []).map(async (purchase: any) => {
          const { count } = await supabase
            .from('purchase_order_items')
            .select('*', { count: 'exact', head: true })
            .eq('purchase_order_id', purchase.id);

          return {
            id: purchase.id,
            codigo_pedido: purchase.codigo_pedido,
            data_pedido: purchase.data_pedido,
            status: purchase.status,
            valor_total: purchase.valor_total,
            supplier_name: purchase.suppliers.razao_social,
            data_aprovacao: purchase.data_aprovacao,
            data_recebimento: purchase.data_recebimento,
            items_count: count || 0,
          } as PurchaseReportData;
        })
      );

      return purchasesWithItems;
    },
  });

  const filteredPurchases = purchases.filter(purchase =>
    purchase.codigo_pedido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = filteredPurchases.reduce((sum, p) => sum + p.valor_total, 0);
  const pendingCount = filteredPurchases.filter(p => p.status === 'pendente').length;
  const approvedCount = filteredPurchases.filter(p => p.status === 'aprovado').length;
  const receivedCount = filteredPurchases.filter(p => p.status === 'recebido').length;

  const handleExportCSV = () => {
    if (filteredPurchases.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = [
      'Código',
      'Fornecedor',
      'Data Pedido',
      'Status',
      'Valor Total',
      'Itens',
      'Data Aprovação',
      'Data Recebimento'
    ];

    const rows = filteredPurchases.map(purchase => [
      purchase.codigo_pedido,
      purchase.supplier_name,
      format(new Date(purchase.data_pedido), 'dd/MM/yyyy', { locale: ptBR }),
      purchase.status,
      `R$ ${purchase.valor_total.toFixed(2)}`,
      purchase.items_count.toString(),
      purchase.data_aprovacao ? format(new Date(purchase.data_aprovacao), 'dd/MM/yyyy') : '-',
      purchase.data_recebimento ? format(new Date(purchase.data_recebimento), 'dd/MM/yyyy') : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-compras-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  const handleExportPDF = () => {
    if (filteredPurchases.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Compras', 14, 15);
    
    doc.setFontSize(10);
    let yPos = 25;
    if (startDate || endDate) {
      const periodoText = `Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : '...'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : '...'}`;
      doc.text(periodoText, 14, yPos);
      yPos += 7;
    }

    doc.text(`Total de Pedidos: ${filteredPurchases.length}`, 14, yPos);
    yPos += 5;
    doc.text(`Valor Total: R$ ${totalValue.toFixed(2)}`, 14, yPos);
    yPos += 5;
    doc.text(`Pendentes: ${pendingCount} | Aprovados: ${approvedCount} | Recebidos: ${receivedCount}`, 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [['Código', 'Fornecedor', 'Data', 'Status', 'Valor']],
      body: filteredPurchases.map(purchase => [
        purchase.codigo_pedido,
        purchase.supplier_name,
        format(new Date(purchase.data_pedido), 'dd/MM/yyyy'),
        purchase.status,
        `R$ ${purchase.valor_total.toFixed(2)}`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`relatorio-compras-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="secondary">Pendente</Badge>;
      case "aprovado":
        return <Badge variant="default">Aprovado</Badge>;
      case "recebido":
        return <Badge>Recebido</Badge>;
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPurchases.length}</div>
            <p className="text-xs text-muted-foreground">No período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Em pedidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedCount}</div>
            <p className="text-xs text-muted-foreground">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Compras</CardTitle>
              <CardDescription>
                Análise completa dos pedidos de compra
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Input
              type="date"
              placeholder="Data inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              type="date"
              placeholder="Data final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos fornecedores</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma compra encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou o período selecionado
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Data Recebimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono">{purchase.codigo_pedido}</TableCell>
                    <TableCell>{purchase.supplier_name}</TableCell>
                    <TableCell>
                      {format(new Date(purchase.data_pedido), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell>{purchase.items_count}</TableCell>
                    <TableCell>
                      R$ {purchase.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {purchase.data_recebimento 
                        ? format(new Date(purchase.data_recebimento), 'dd/MM/yyyy', { locale: ptBR })
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredPurchases.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredPurchases.length} {filteredPurchases.length === 1 ? 'pedido' : 'pedidos'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
