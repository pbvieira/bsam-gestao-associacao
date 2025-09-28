import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Search, AlertTriangle, Edit, History, Plus } from "lucide-react";
import { useInventory } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";

interface InventoryListProps {
  onCreateItem: () => void;
  onEditItem: (item: any) => void;
  onViewMovements: (item: any) => void;
}

export function InventoryList({ onCreateItem, onEditItem, onViewMovements }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { items, loading, getLowStockItems } = useInventory();
  const { canAccess } = useAuth();

  const canCreate = canAccess('inventory');
  const canUpdate = canAccess('inventory');

  const filteredItems = items.filter(item =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.categoria && item.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockItems = getLowStockItems();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">{lowStockItems.length} itens</span> com estoque baixo.
            {' '}
            <span className="text-sm">
              {lowStockItems.slice(0, 3).map(item => item.nome).join(', ')}
              {lowStockItems.length > 3 && ` e mais ${lowStockItems.length - 3} itens`}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Items List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <CardTitle className="flex-1">Lista de Itens</CardTitle>
          </div>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar o termo de busca' : 'Comece adicionando seu primeiro item'}
              </p>
              {!searchTerm && (
                <Button
                  disabled={!canCreate}
                  onClick={onCreateItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{item.nome}</h3>
                      {item.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {item.categoria}
                        </Badge>
                      )}
                      {item.estoque_atual <= item.estoque_minimo && item.estoque_minimo > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Estoque Baixo
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Estoque: {item.estoque_atual}</span>
                      <span>Mínimo: {item.estoque_minimo}</span>
                      <span>Origem: {item.origem === 'compra' ? 'Compra' : 'Doação'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!canUpdate}
                      onClick={() => onEditItem(item)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewMovements(item)}
                      className="gap-2"
                    >
                      <History className="h-4 w-4" />
                      Histórico
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}