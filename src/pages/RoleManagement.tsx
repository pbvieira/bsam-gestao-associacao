import { MainLayout } from "@/components/layout/main-layout";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { PageLayout } from "@/components/layout/page-layout";
import { RolePermissionsTable } from "@/components/roles/role-permissions-table";
import { RoleAuditLog } from "@/components/roles/role-audit-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoleManagement() {
  return (
    <UnifiedRoute module="users" action="read">
      <MainLayout>
        <PageLayout
          title="Gestão de Funções e Permissões"
          subtitle="Crie funções personalizadas, ajuste permissões granulares e acompanhe a trilha de auditoria"
        >
          <Tabs defaultValue="roles" className="space-y-4">
            <TabsList>
              <TabsTrigger value="roles">Funções e permissões</TabsTrigger>
              <TabsTrigger value="audit">Trilha de auditoria</TabsTrigger>
            </TabsList>
            <TabsContent value="roles">
              <RolePermissionsTable />
            </TabsContent>
            <TabsContent value="audit">
              <RoleAuditLog />
            </TabsContent>
          </Tabs>
        </PageLayout>
      </MainLayout>
    </UnifiedRoute>
  );
}
