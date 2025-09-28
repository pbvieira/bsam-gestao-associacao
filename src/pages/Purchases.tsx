import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";

import { PurchaseList } from "@/components/purchases/purchase-list";
import { PurchaseForm } from "@/components/purchases/purchase-form";
import { PurchaseView } from "@/components/purchases/purchase-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function Purchases() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleCreateOrder = () => {
    setSelectedOrder(null);
    setViewMode('create');
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setViewMode('edit');
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedOrder(null);
  };

  return (
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
                {viewMode === 'list' && 'Pedidos de Compra'}
                {viewMode === 'create' && 'Novo Pedido'}
                {viewMode === 'edit' && `Editar: ${selectedOrder?.codigo_pedido}`}
                {viewMode === 'view' && `Pedido: ${selectedOrder?.codigo_pedido}`}
              </h1>
              <p className="text-muted-foreground">
                {viewMode === 'list' && 'Controle completo dos pedidos de compra'}
                {viewMode === 'create' && 'Crie um novo pedido de compra'}
                {viewMode === 'edit' && 'Edite as informações do pedido'}
                {viewMode === 'view' && 'Visualize e gerencie o pedido de compra'}
              </p>
            </div>

            {viewMode === 'list' && (
              <Button onClick={handleCreateOrder} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Pedido
              </Button>
            )}
          </div>
          
          {viewMode === 'list' && (
            <PurchaseList 
              onCreateOrder={handleCreateOrder}
              onEditOrder={handleEditOrder}
              onViewOrder={handleViewOrder}
            />
          )}
          
          {(viewMode === 'create' || viewMode === 'edit') && (
            <PurchaseForm 
              order={selectedOrder}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          )}

          {viewMode === 'view' && selectedOrder && (
            <PurchaseView 
              order={selectedOrder}
              onEdit={() => handleEditOrder(selectedOrder)}
            />
          )}
        </div>
      </MainLayout>
  );
}