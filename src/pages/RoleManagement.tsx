import { MainLayout } from "@/components/layout/main-layout";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { PageLayout } from "@/components/layout/page-layout";
import { RolePermissionsTable } from "@/components/roles/role-permissions-table";

export default function RoleManagement() {
  return (
    <UnifiedRoute module="users" action="read">
      <MainLayout>
        <PageLayout
          title="Gestão de Funções e Permissões"
          subtitle="Crie funções personalizadas e ajuste as permissões granulares de cada uma"
        >
          <RolePermissionsTable />
        </PageLayout>
      </MainLayout>
    </UnifiedRoute>
  );
}
