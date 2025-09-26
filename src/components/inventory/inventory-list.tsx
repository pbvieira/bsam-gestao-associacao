import { useState } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  AlertTriangle, 
  Package, 
  TrendingUp,
  History
} from 'lucide-react';

interface InventoryListProps {
  onCreateItem: () => void;
  onEditItem: (item: any) => void;
  onViewMovements: (item: any) => void;
}

export function InventoryList({ onCreateItem, onEditItem, onViewMovements }: InventoryListProps) {
  const { items, loading, getLowStockItems, getTotalValue } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = items.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = getLowStockItems();
  const totalValue = getTotalValue();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={onCreateItem} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Itens</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Estoque Baixo</p>
                <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Valor Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Resultados</p>
                <p className="text-2xl font-bold">{filteredItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Alerta de Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600 mb-3">
              {lowStockItems.length} {lowStockItems.length === 1 ? 'item está' : 'itens estão'} com estoque abaixo do mínimo:
            </p>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge key={item.id} variant="outline" className="border-orange-300">
                  {item.nome} ({item.estoque_atual}/{item.estoque_minimo})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{item.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.categoria}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={item.origem === 'compra' ? 'default' : 'secondary'}>
                    {item.origem === 'compra' ? 'Compra' : 'Doação'}
                  </Badge>
                  {item.estoque_atual <= item.estoque_minimo && item.estoque_minimo > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      <AlertTriangle className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {item.descricao && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.descricao}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Estoque Atual</p>
                  <p className="font-medium text-lg">
                    {item.estoque_atual}
                    {item.unidade_medida && <span className="text-xs ml-1">{item.unidade_medida}</span>}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estoque Mínimo</p>
                  <p className="font-medium text-lg">{item.estoque_minimo}</p>
                </div>
              </div>

              {item.valor_unitario && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Valor Unitário</p>
                  <p className="font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(item.valor_unitario)}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditItem(item)}
                  className="flex-1 gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewMovements(item)}
                  className="gap-2"
                >
                  <History className="h-3 w-3" />
                  Histórico
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum item encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando o primeiro item do estoque.'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Item
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}