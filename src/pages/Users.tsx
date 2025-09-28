import { MainLayout } from "@/components/layout/main-layout";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { UserList } from "@/components/users/user-list";

export default function Users() {
  return (
    <UnifiedRoute module="users" action="read">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground">
              Gerenciamento de usuários e permissões do sistema
            </p>
          </div>
          
          <UserList />
        </div>
      </MainLayout>
    </UnifiedRoute>
  );
}