import { MainLayout } from "@/components/layout/main-layout";
import { WorkspaceHeader } from "@/components/dashboard/workspace-header";
import { WorkspaceArea } from "@/components/dashboard/workspace-area";
import { NotificationCenter } from "@/components/dashboard/notification-center";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Personalizado */}
        <WorkspaceHeader />

        {/* Central de Notificações */}
        <NotificationCenter />

        {/* Minha Área de Trabalho */}
        <WorkspaceArea />
      </div>
    </MainLayout>
  );
};

export default Index;
