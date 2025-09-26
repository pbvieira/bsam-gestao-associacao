import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function Students() {
  return (
    <ProtectedRoute module="students">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
            <p className="text-muted-foreground">
              Gestão completa dos assistidos da associação
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