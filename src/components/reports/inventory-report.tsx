import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Download, AlertTriangle, Package } from 'lucide-react';

interface InventoryReportData {
  id: string;
  nome: string;
  categoria: string;
  origem: string;
  estoque_atual: number;
  estoque_minimo: number;
  valor_unitario: number;
  unidade_medida: string;
  ativo: boolean;
  created_at: string;
  movements_count: number;
  status: 'normal' | 'low' | 'out';
}

export function InventoryReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nome');

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory-report', searchTerm, categoryFilter, statusFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_movements (id)
        `);

      if (searchTerm) {
        query = query.or(
          `nome.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`
        );
      }

      if (categoryFilter !== 'all') {
        query = query.eq('categoria', categoryFilter);
      }

      query = query.eq('ativo', true);

      const { data, error } = await query.order(sortBy, { ascending: true });
      if (error) throw error;

      // Process data to include movement count and status
      return data?.map(item => {
        let status: 'normal' | 'low' | 'out' = 'normal';
        if (item.estoque_atual === 0) {
          status = 'out';
        } else if (item.estoque_atual <= item.estoque_minimo) {
          status = 'low';
        }

        return {
          ...item,
          movements_count: item.inventory_movements?.length || 0,
          status,
        };
      }).filter(item => {
        if (statusFilter === 'all') return true;
        return item.status === statusFilter;
      }) as InventoryReportData[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('categoria')
        .not('categoria', 'is', null)
        .eq('ativo', true);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(item => item.categoria))];
      return uniqueCategories.filter(Boolean);
    },
  });

  const handleExport = () => {
    if (!inventory) return;

    const csv = [
      ['Nome', 'Categoria', 'Origem', 'Estoque Atual', 'Estoque Mínimo', 'Valor Unitário', 'Unidade', 'Status', 'Movimentações'].join(','),
      ...inventory.map(item => [
        item.nome,
        item.categoria || '',
        item.origem,
        item.estoque_atual,
        item.estoque_minimo,
        item.valor_unitario?.toString() || '0',
        item.unidade_medida || '',
        item.status === 'out' ? 'Sem Estoque' : item.status === 'low' ? 'Estoque Baixo' : 'Normal',
        item.movements_count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: 'normal' | 'low' | 'out') => {
    switch (status) {
      case 'out':
        return <Badge variant="destructive">Sem Estoque</Badge>;
      case 'low':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Estoque Baixo</Badge>;
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowStockCount = inventory?.filter(item => item.status === 'low').length || 0;
  const outOfStockCount = inventory?.filter(item => item.status === 'out').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Relatório de Estoque
              {(lowStockCount > 0 || outOfStockCount > 0) && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </CardTitle>
            <CardDescription>
              Visualizar dados detalhados do estoque - {lowStockCount} itens com estoque baixo, {outOfStockCount} sem estoque
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories?.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="low">Estoque Baixo</SelectItem>
              <SelectItem value="out">Sem Estoque</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome">Nome</SelectItem>
              <SelectItem value="categoria">Categoria</SelectItem>
              <SelectItem value="estoque_atual">Estoque Atual</SelectItem>
              <SelectItem value="valor_unitario">Valor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {!inventory || inventory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum item encontrado.' : 'Nenhum item cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead className="text-right">Valor Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Movimentações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nome}
                    </TableCell>
                    <TableCell>
                      {item.categoria && (
                        <Badge variant="outline">{item.categoria}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.origem}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.estoque_atual} {item.unidade_medida}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.estoque_minimo} {item.unidade_medida}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.valor_unitario 
                        ? `R$ ${item.valor_unitario.toFixed(2)}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {item.movements_count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {inventory && inventory.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {inventory.length} ite{inventory.length !== 1 ? 'ns' : 'm'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}