import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Inventory() {
  return (
    <ProtectedRoute module="inventory">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Estoque</h1>
            <p className="text-muted-foreground">
              Controle de estoque e movimentações de itens
            </p>
          </div>
          
          <div className="text-center py-12">
            <p className="text-muted-foreground">Módulo em desenvolvimento...</p>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}