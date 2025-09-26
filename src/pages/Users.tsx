import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Users() {
  return (
    <ProtectedRoute module="users">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerenciamento de usuários e permissões do sistema
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