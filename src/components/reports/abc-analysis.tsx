import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, Package } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ABCItem {
  id: string;
  nome: string;
  categoria: string | null;
  estoque_atual: number;
  valor_unitario: number;
  valor_total: number;
  percentual_valor: number;
  percentual_acumulado: number;
  classe: 'A' | 'B' | 'C';
}

export function ABCAnalysis() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['abc-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, nome, categoria, estoque_atual, valor_unitario')
        .eq('ativo', true)
        .not('valor_unitario', 'is', null);

      if (error) throw error;

      // Calculate total value for each item
      const itemsWithValue = (data || [])
        .map(item => ({
          ...item,
          valor_total: item.estoque_atual * (item.valor_unitario || 0)
        }))
        .filter(item => item.valor_total > 0)
        .sort((a, b) => b.valor_total - a.valor_total);

      const totalValue = itemsWithValue.reduce((sum, item) => sum + item.valor_total, 0);

      // Calculate percentages and classify
      let acumulado = 0;
      const itemsWithClass = itemsWithValue.map((item) => {
        const percentual_valor = (item.valor_total / totalValue) * 100;
        acumulado += percentual_valor;

        let classe: 'A' | 'B' | 'C';
        if (acumulado <= 80) {
          classe = 'A';
        } else if (acumulado <= 95) {
          classe = 'B';
        } else {
          classe = 'C';
        }

        return {
          id: item.id,
          nome: item.nome,
          categoria: item.categoria,
          estoque_atual: item.estoque_atual,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          percentual_valor,
          percentual_acumulado: acumulado,
          classe,
        } as ABCItem;
      });

      return itemsWithClass;
    },
  });

  const classAItems = items.filter(i => i.classe === 'A');
  const classBItems = items.filter(i => i.classe === 'B');
  const classCItems = items.filter(i => i.classe === 'C');

  const totalValueA = classAItems.reduce((sum, i) => sum + i.valor_total, 0);
  const totalValueB = classBItems.reduce((sum, i) => sum + i.valor_total, 0);
  const totalValueC = classCItems.reduce((sum, i) => sum + i.valor_total, 0);

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = [
      'Item',
      'Categoria',
      'Estoque',
      'Valor Unit.',
      'Valor Total',
      '% Valor',
      '% Acumulado',
      'Classe'
    ];

    const rows = items.map(item => [
      item.nome,
      item.categoria || '-',
      item.estoque_atual.toString(),
      `R$ ${item.valor_unitario.toFixed(2)}`,
      `R$ ${item.valor_total.toFixed(2)}`,
      `${item.percentual_valor.toFixed(2)}%`,
      `${item.percentual_acumulado.toFixed(2)}%`,
      item.classe
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `curva-abc-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  const handleExportPDF = () => {
    if (items.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Análise de Curva ABC', 14, 15);
    
    doc.setFontSize(10);
    let yPos = 25;
    doc.text(`Total de Itens: ${items.length}`, 14, yPos);
    yPos += 5;
    doc.text(`Classe A: ${classAItems.length} itens (${((totalValueA / (totalValueA + totalValueB + totalValueC)) * 100).toFixed(1)}% do valor)`, 14, yPos);
    yPos += 5;
    doc.text(`Classe B: ${classBItems.length} itens (${((totalValueB / (totalValueA + totalValueB + totalValueC)) * 100).toFixed(1)}% do valor)`, 14, yPos);
    yPos += 5;
    doc.text(`Classe C: ${classCItems.length} itens (${((totalValueC / (totalValueA + totalValueB + totalValueC)) * 100).toFixed(1)}% do valor)`, 14, yPos);
    yPos += 10;

    autoTable(doc, {
      startY: yPos,
      head: [['Item', 'Estoque', 'Valor Total', '% Valor', 'Classe']],
      body: items.map(item => [
        item.nome,
        item.estoque_atual.toString(),
        `R$ ${item.valor_total.toFixed(2)}`,
        `${item.percentual_valor.toFixed(2)}%`,
        item.classe
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`curva-abc-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF gerado com sucesso!");
  };

  const getClasseBadge = (classe: 'A' | 'B' | 'C') => {
    switch (classe) {
      case 'A':
        return <Badge className="bg-red-500">A</Badge>;
      case 'B':
        return <Badge className="bg-yellow-500">B</Badge>;
      case 'C':
        return <Badge className="bg-green-500">C</Badge>;
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classe A</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classAItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {classAItems.length > 0 ? `${((totalValueA / (totalValueA + totalValueB + totalValueC)) * 100).toFixed(1)}% do valor total` : 'Nenhum item'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {totalValueA.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classe B</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classBItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {classBItems.length > 0 ? `${((totalValueB / (totalValueA + totalValueB + totalValueC)) * 100).toFixed(1)}% do valor total` : 'Nenhum item'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {totalValueB.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classe C</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classCItems.length}</div>
            <p className="text-xs text-muted-foreground">
              {classCItems.length > 0 ? `${((totalValueC / (totalValueA + totalValueB + totalValueC)) * 100).toFixed(1)}% do valor total` : 'Nenhum item'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              R$ {totalValueC.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre a Curva ABC</CardTitle>
          <CardDescription>
            A Análise ABC classifica os itens do estoque por importância financeira
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500">A</Badge>
            <p>
              <strong>Classe A:</strong> Itens mais importantes (≈20% dos itens, 80% do valor). 
              Requerem controle rigoroso e atenção especial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-500">B</Badge>
            <p>
              <strong>Classe B:</strong> Itens de importância intermediária (≈30% dos itens, 15% do valor). 
              Controle moderado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500">C</Badge>
            <p>
              <strong>Classe C:</strong> Itens menos importantes (≈50% dos itens, 5% do valor). 
              Controle simplificado.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Report */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análise de Curva ABC</CardTitle>
              <CardDescription>
                Classificação dos itens por valor financeiro
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
        </CardHeader>

        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum item com valor</h3>
              <p className="text-muted-foreground">
                Para gerar a curva ABC, é necessário que os itens tenham estoque e valor unitário cadastrados
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Valor Unit.</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>% Valor</TableHead>
                  <TableHead>% Acumulado</TableHead>
                  <TableHead>Classe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>
                      {item.categoria ? (
                        <Badge variant="secondary">{item.categoria}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{item.estoque_atual}</TableCell>
                    <TableCell>R$ {item.valor_unitario.toFixed(2)}</TableCell>
                    <TableCell>R$ {item.valor_total.toFixed(2)}</TableCell>
                    <TableCell>{item.percentual_valor.toFixed(2)}%</TableCell>
                    <TableCell>{item.percentual_acumulado.toFixed(2)}%</TableCell>
                    <TableCell>{getClasseBadge(item.classe)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {items.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {items.length} {items.length === 1 ? 'item' : 'itens'} classificados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
