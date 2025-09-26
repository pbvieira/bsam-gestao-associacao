import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { InventoryList } from "@/components/inventory/inventory-list";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryMovements } from "@/components/inventory/inventory-movements";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";

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