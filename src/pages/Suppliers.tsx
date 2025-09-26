import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SupplierList } from "@/components/suppliers/supplier-list";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";

type ViewMode = 'list' | 'create' | 'edit';

export default function Suppliers() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const handleCreateSupplier = () => {
    setSelectedSupplier(null);
    setViewMode('create');
  };

  const handleEditSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setViewMode('edit');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedSupplier(null);
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
                {viewMode === 'list' && 'Fornecedores'}
                {viewMode === 'create' && 'Novo Fornecedor'}
                {viewMode === 'edit' && `Editar: ${selectedSupplier?.razao_social}`}
              </h1>
              <p className="text-muted-foreground">
                {viewMode === 'list' && 'Gerencie os fornecedores da sua organização'}
                {viewMode === 'create' && 'Cadastre um novo fornecedor'}
                {viewMode === 'edit' && 'Edite as informações do fornecedor'}
              </p>
            </div>

            {viewMode === 'list' && (
              <Button onClick={handleCreateSupplier} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Fornecedor
              </Button>
            )}
          </div>
          
          {viewMode === 'list' && (
            <SupplierList 
              onCreateSupplier={handleCreateSupplier}
              onEditSupplier={handleEditSupplier}
            />
          )}
          
          {(viewMode === 'create' || viewMode === 'edit') && (
            <SupplierForm 
              supplier={selectedSupplier}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
            />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}