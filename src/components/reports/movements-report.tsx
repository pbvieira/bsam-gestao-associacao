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
import { Download, FileText, Search, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MovementReportData {
  id: string;
  data_movimento: string;
  tipo_movimento: 'entrada' | 'saida';
  quantidade: number;
  valor_unitario: number | null;
  origem_movimento: string;
  observacoes: string | null;
  item_nome: string;
  item_categoria: string | null;
}

export function MovementsReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [origemFilter, setOrigemFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("data_movimento");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['movements-report', startDate, endDate, tipoFilter, origemFilter, sortBy, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('inventory_movements')
        .select(`
          *,
          inventory_items!inner(nome, categoria)
        `);

      if (startDate) {
        query = query.gte('data_movimento', startDate);
      }
      if (endDate) {
        query = query.lte('data_movimento', endDate);
      }
      if (tipoFilter !== 'all') {
        query = query.eq('tipo_movimento', tipoFilter);
      }
      if (origemFilter !== 'all') {
        query = query.eq('origem_movimento', origemFilter);
      }

      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        data_movimento: item.data_movimento,
        tipo_movimento: item.tipo_movimento,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        origem_movimento: item.origem_movimento,
        observacoes: item.observacoes,
        item_nome: item.inventory_items.nome,
        item_categoria: item.inventory_items.categoria,
      })) as MovementReportData[];
    },
  });

  const filteredMovements = movements.filter(movement =>
    movement.item_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (movement.item_categoria?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (movement.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalEntradas = filteredMovements
    .filter(m => m.tipo_movimento === 'entrada')
    .reduce((sum, m) => sum + m.quantidade, 0);

  const totalSaidas = filteredMovements
    .filter(m => m.tipo_movimento === 'saida')
    .reduce((sum, m) => sum + m.quantidade, 0);

  const valorTotalEntradas = filteredMovements
    .filter(m => m.tipo_movimento === 'entrada' && m.valor_unitario)
    .reduce((sum, m) => sum + (m.quantidade * (m.valor_unitario || 0)), 0);

  const valorTotalSaidas = filteredMovements
    .filter(m => m.tipo_movimento === 'saida' && m.valor_unitario)
    .reduce((sum, m) => sum + (m.quantidade * (m.valor_unitario || 0)), 0);

  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = [
      'Data',
      'Item',
      'Categoria',
      'Tipo',
      'Origem',
      'Quantidade',
      'Valor Unit.',
      'Valor Total',
      'Observações'
    ];

    const rows = filteredMovements.map(movement => [
      format(new Date(movement.data_movimento), 'dd/MM/yyyy', { locale: ptBR }),
      movement.item_nome,
      movement.item_categoria || '-',
      movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída',
      movement.origem_movimento,
      movement.quantidade.toString(),
      movement.valor_unitario ? `R$ ${movement.valor_unitario.toFixed(2)}` : '-',
      movement.valor_unitario ? `R$ ${(movement.quantidade * movement.valor_unitario).toFixed(2)}` : '-',
      movement.observacoes || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-movimentacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  const handleExportPDF = () => {
    if (filteredMovements.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    doc.text('Relatório de Movimentações', 14, 15);
    
    // Período
    doc.setFontSize(10);
    let yPos = 25;
    if (startDate || endDate) {
      const periodoText = `Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : '...'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : '...'}`;
      doc.text(periodoText, 14, yPos);
      yPos += 7;
    }

    // Resumo
    doc.text(`Total de Movimentações: ${filteredMovements.length}`, 14, yPos);
    yPos += 5;
    doc.text(`Entradas: ${totalEntradas} unidades (R$ ${valorTotalEntradas.toFixed(2)})`, 14, yPos);
    yPos += 5;
    doc.text(`Saídas: ${totalSaidas} unidades (R$ ${valorTotalSaidas.toFixed(2)})`, 14, yPos);
    yPos += 10;

    // Tabela
    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Item', 'Tipo', 'Qtd', 'Valor Unit.', 'Total']],
      body: filteredMovements.map(movement => [
        format(new Date(movement.data_movimento), 'dd/MM/yyyy'),
        movement.item_nome,
        movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída',
        movement.quantidade.toString(),
        movement.valor_unitario ? `R$ ${movement.valor_unitario.toFixed(2)}` : '-',
        movement.valor_unitario ? `R$ ${(movement.quantidade * movement.valor_unitario).toFixed(2)}` : '-'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`relatorio-movimentacoes-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success("PDF gerado com sucesso!");
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
            <CardTitle className="text-sm font-medium">Total Movimentações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMovements.length}</div>
            <p className="text-xs text-muted-foreground">Registros no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntradas}</div>
            <p className="text-xs text-muted-foreground">
              R$ {valorTotalEntradas.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSaidas}</div>
            <p className="text-xs text-muted-foreground">
              R$ {valorTotalSaidas.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntradas - totalSaidas}</div>
            <p className="text-xs text-muted-foreground">
              R$ {(valorTotalEntradas - valorTotalSaidas).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Movimentações</CardTitle>
              <CardDescription>
                Análise detalhada de entradas e saídas do estoque
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

            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>

            <Select value={origemFilter} onValueChange={setOrigemFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="compra">Compra</SelectItem>
                <SelectItem value="doacao">Doação</SelectItem>
                <SelectItem value="consumo">Consumo</SelectItem>
                <SelectItem value="perda">Perda</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou o período selecionado
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {format(new Date(movement.data_movimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{movement.item_nome}</TableCell>
                    <TableCell>
                      {movement.item_categoria ? (
                        <Badge variant="secondary">{movement.item_categoria}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.tipo_movimento === 'entrada' ? 'default' : 'destructive'}>
                        {movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.origem_movimento}</Badge>
                    </TableCell>
                    <TableCell>{movement.quantidade}</TableCell>
                    <TableCell>
                      {movement.valor_unitario 
                        ? `R$ ${movement.valor_unitario.toFixed(2)}` 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {movement.valor_unitario 
                        ? `R$ ${(movement.quantidade * movement.valor_unitario).toFixed(2)}` 
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredMovements.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredMovements.length} {filteredMovements.length === 1 ? 'registro' : 'registros'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
