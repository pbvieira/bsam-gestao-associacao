import { MainLayout } from "@/components/layout/main-layout";
import { WorkspaceHeader } from "@/components/dashboard/workspace-header";
import { WorkspaceArea } from "@/components/dashboard/workspace-area";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Personalizado */}
        <WorkspaceHeader />

        {/* Minha Área de Trabalho */}
        <WorkspaceArea />
      </div>
    </MainLayout>
  );
};

export default Index;
