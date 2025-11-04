import { MainLayout } from "@/components/layout/main-layout";
import { WorkspaceHeader } from "@/components/dashboard/workspace-header";
import { WorkspaceArea } from "@/components/dashboard/workspace-area";
import { ProductivityStats } from "@/components/dashboard/productivity-stats";
import { WorkspaceActions } from "@/components/dashboard/workspace-actions";
import { NotificationCenter } from "@/components/dashboard/notification-center";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Personalizado */}
        <WorkspaceHeader />

        {/* Widgets Inteligentes - Prioridade Total */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ProductivityStats />
          <NotificationCenter />
          <div className="lg:col-span-1">
            <WorkspaceActions />
          </div>
        </div>

        {/* Minha Área de Trabalho */}
        <WorkspaceArea />
      </div>
    </MainLayout>
  );
};

export default Index;
