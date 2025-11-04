import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Package, Search, AlertTriangle, Edit, History, Plus, Filter } from "lucide-react";
import { useInventory, type InventoryFilters } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";

interface InventoryListProps {
  onCreateItem: () => void;
  onEditItem: (item: any) => void;
  onViewMovements: (item: any) => void;
}

const ITEMS_PER_PAGE = 10;

export function InventoryList({ onCreateItem, onEditItem, onViewMovements }: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoria, setCategoria] = useState<string>("todos");
  const [stockStatus, setStockStatus] = useState<string>("todos");
  const [origem, setOrigem] = useState<string>("todos");
  const [unidadeMedida, setUnidadeMedida] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("nome");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const { items, loading, getLowStockItems, fetchItems, getCategories, getUnits } = useInventory();
  const { canAccess } = useAuth();

  const canCreate = canAccess('inventory');
  const canUpdate = canAccess('inventory');

  const categories = getCategories();
  const units = getUnits();

  // Apply filters
  useEffect(() => {
    const filters: InventoryFilters = {
      searchTerm: searchTerm || undefined,
      categoria: categoria !== 'todos' ? categoria : undefined,
      stockStatus: stockStatus as any,
      origem: origem as any,
      unidadeMedida: unidadeMedida !== 'todos' ? unidadeMedida : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    };
    fetchItems(filters);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, categoria, stockStatus, origem, unidadeMedida, sortBy, sortOrder]);

  const lowStockItems = getLowStockItems();

  // Pagination
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <CardTitle className="flex-1">Lista de Itens</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Badge variant="secondary">{items.length} itens</Badge>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status do Estoque</label>
                  <Select value={stockStatus} onValueChange={setStockStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="baixo">Estoque Baixo</SelectItem>
                      <SelectItem value="zerado">Zerado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Origem</label>
                  <Select value={origem} onValueChange={setOrigem}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="doacao">Doação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Unidade</label>
                  <Select value={unidadeMedida} onValueChange={setUnidadeMedida}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nome">Nome</SelectItem>
                      <SelectItem value="categoria">Categoria</SelectItem>
                      <SelectItem value="estoque_atual">Estoque</SelectItem>
                      <SelectItem value="valor_unitario">Valor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ordem</label>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Crescente</SelectItem>
                      <SelectItem value="desc">Decrescente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoria !== 'todos' || stockStatus !== 'todos' || origem !== 'todos' 
                  ? 'Tente ajustar os filtros de busca' 
                  : 'Comece adicionando seu primeiro item'}
              </p>
              {!searchTerm && categoria === 'todos' && stockStatus === 'todos' && origem === 'todos' && (
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
            <>
              <div className="space-y-4">
                {paginatedItems.map((item) => (
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
                        {item.estoque_atual === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Zerado
                          </Badge>
                        )}
                        {item.estoque_atual > 0 && item.estoque_atual <= item.estoque_minimo && item.estoque_minimo > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            Estoque Baixo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Estoque: {item.estoque_atual} {item.unidade_medida || ''}</span>
                        <span>Mínimo: {item.estoque_minimo}</span>
                        <span>Origem: {item.origem === 'compra' ? 'Compra' : 'Doação'}</span>
                        {item.valor_unitario && (
                          <span>Valor: R$ {item.valor_unitario.toFixed(2)}</span>
                        )}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  <div className="text-center mt-2 text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, items.length)} de {items.length} itens
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}