import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { InventoryList } from "@/components/inventory/inventory-list";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryMovements } from "@/components/inventory/inventory-movements";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Truck, ShoppingCart } from "lucide-react";

type ViewMode = 'list' | 'create' | 'edit' | 'movements';

export default function Inventory() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const handleCreateItem = () => {
    setSelectedItem(null);
    setViewMode('create');
  };

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setViewMode('edit');
  };

  const handleViewMovements = (item: any) => {
    setSelectedItem(item);
    setViewMode('movements');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedItem(null);
  };

  return (
    <ProtectedRoute module="inventory">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {viewMode !== 'list' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {viewMode === 'list' && 'Estoque'}
                {viewMode === 'create' && 'Novo Item'}
                {viewMode === 'edit' && `Editar: ${selectedItem?.nome}`}
                {viewMode === 'movements' && `Movimentações: ${selectedItem?.nome}`}
              </h1>
              <p className="text-muted-foreground">
                {viewMode === 'list' && 'Controle completo do estoque da associação'}
                {viewMode === 'create' && 'Cadastre um novo item no estoque'}
                {viewMode === 'edit' && 'Edite as informações do item'}
                {viewMode === 'movements' && 'Histórico de entradas e saídas do item'}
              </p>
            </div>

            {viewMode === 'list' && (
              <Button onClick={handleCreateItem} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Item
              </Button>
            )}
          </div>
          
          {viewMode === 'list' && (
            <Tabs defaultValue="items" className="w-full">
              <TabsList>
                <TabsTrigger value="items">Itens do Estoque</TabsTrigger>
                <TabsTrigger value="movements">Movimentações Recentes</TabsTrigger>
                <TabsTrigger value="suppliers">
                  <Truck className="h-4 w-4 mr-2" />
                  Fornecedores
                </TabsTrigger>
                <TabsTrigger value="purchases">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Pedidos de Compra
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="items" className="space-y-4">
                <InventoryList 
                  onCreateItem={handleCreateItem}
                  onEditItem={handleEditItem}
                  onViewMovements={handleViewMovements}
                />
              </TabsContent>
              
              <TabsContent value="movements" className="space-y-4">
                <InventoryMovements />
              </TabsContent>
              
              <TabsContent value="suppliers" className="space-y-4">
                <div className="text-center py-8">
                  <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Módulo de Fornecedores
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Gerencie seus fornecedores em uma página dedicada
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/fornecedores'}
                    className="gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Ir para Fornecedores
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="purchases" className="space-y-4">
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Módulo de Pedidos de Compra
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Gerencie seus pedidos de compra em uma página dedicada
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/pedidos'}
                    className="gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Ir para Pedidos
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          {(viewMode === 'create' || viewMode === 'edit') && (
            <InventoryForm 
              item={selectedItem}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          )}
          
          {viewMode === 'movements' && selectedItem && (
            <InventoryMovements itemId={selectedItem.id} />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}