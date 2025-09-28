import { MainLayout } from "@/components/layout/main-layout";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { PageLayout } from "@/components/layout/page-layout";
import { RoleAccessMatrix } from "@/components/roles/role-access-matrix";

export default function RoleManagement() {
  return (
    <UnifiedRoute module="users" action="read">
      <MainLayout>
        <PageLayout
          title="Gestão de Permissões por Role"
          subtitle="Configure as permissões de acesso aos módulos do sistema para cada tipo de usuário"
        >
          <RoleAccessMatrix />
        </PageLayout>
      </MainLayout>
    </UnifiedRoute>
  );
}