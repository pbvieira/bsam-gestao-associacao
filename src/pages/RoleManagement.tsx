import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/main-layout";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { PageLayout } from "@/components/layout/page-layout";
import { RolePermissionsTable } from "@/components/roles/role-permissions-table";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export default function RoleManagement() {
  return (
    <UnifiedRoute module="users" action="read">
      <MainLayout>
        <PageLayout
          title="Gestão de Funções e Permissões"
          subtitle="Crie funções personalizadas e ajuste permissões granulares"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link to="/gestao-roles/auditoria">
                <History className="h-4 w-4 mr-2" />
                Trilha de auditoria
              </Link>
            </Button>
          }
        >
          <RolePermissionsTable />
        </PageLayout>
      </MainLayout>
    </UnifiedRoute>
  );
}
