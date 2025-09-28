import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLayout } from "@/components/layout/page-layout";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import { InventoryList } from "@/components/inventory/inventory-list";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryMovements } from "@/components/inventory/inventory-movements";
import { InventoryStats } from "@/components/inventory/inventory-stats";
import { SupplierList } from "@/components/suppliers/supplier-list";
import { PurchaseList } from "@/components/purchases/purchase-list";
import { useInventory } from "@/hooks/use-inventory";

type ViewMode = 'list' | 'create' | 'edit' | 'movements';

export default function Inventory() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { items, getLowStockItems, getTotalValue } = useInventory();

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

  const lowStockItems = getLowStockItems();
  const totalValue = getTotalValue();

  const getTitle = () => {
    switch (viewMode) {
      case 'create':
        return 'Novo Item';
      case 'edit':
        return `Editar: ${selectedItem?.nome}`;
      case 'movements':
        return `Movimentações: ${selectedItem?.nome}`;
      default:
        return 'Estoque';
    }
  };

  const getDescription = () => {
    switch (viewMode) {
      case 'create':
        return 'Adicione um novo item ao seu estoque';
      case 'edit':
        return 'Edite as informações do item selecionado';
      case 'movements':
        return 'Visualize o histórico de movimentações do item';
      default:
        return 'Gerencie seu inventário e acompanhe as movimentações';
    }
  };

  const actionButton = viewMode === 'list' ? (
    <Button onClick={handleCreateItem} className="gap-2">
      <Plus className="h-4 w-4" />
      Novo Item
    </Button>
  ) : undefined;

  return (
    <MainLayout>
        <PageLayout
          title={getTitle()}
          subtitle={getDescription()}
          actionButton={actionButton}
          showBackButton={viewMode !== 'list'}
          onBackClick={handleBackToList}
          statsCards={viewMode === 'list' ? (
            <InventoryStats 
              items={items}
              totalValue={totalValue}
              lowStockItems={lowStockItems}
            />
          ) : undefined}
        >
          {/* Main Content */}
          {viewMode === 'list' && (
            <Tabs defaultValue="items" className="space-y-6">
              <TabsList>
                <TabsTrigger value="items">Itens</TabsTrigger>
                <TabsTrigger value="movements">Movimentações</TabsTrigger>
                <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
                <TabsTrigger value="purchases">Compras</TabsTrigger>
              </TabsList>
              
              <TabsContent value="items">
                <InventoryList 
                  onCreateItem={handleCreateItem}
                  onEditItem={handleEditItem}
                  onViewMovements={handleViewMovements}
                />
              </TabsContent>
              
              <TabsContent value="movements">
                <InventoryMovements />
              </TabsContent>
              
              <TabsContent value="suppliers">
                <SupplierList 
                  onCreateSupplier={() => {}} 
                  onEditSupplier={() => {}}
                />
              </TabsContent>
              
              <TabsContent value="purchases">
                <PurchaseList 
                  onCreateOrder={() => {}}
                  onEditOrder={() => {}}
                  onViewOrder={() => {}}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* Form */}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <InventoryForm 
              item={selectedItem}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          )}

          {/* Movements */}
          {viewMode === 'movements' && selectedItem && (
            <InventoryMovements itemId={selectedItem.id} />
          )}
        </PageLayout>
      </MainLayout>
  );
}