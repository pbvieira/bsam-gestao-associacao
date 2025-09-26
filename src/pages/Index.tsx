import { MainLayout } from "@/components/layout/main-layout";
import { WorkspaceHeader } from "@/components/dashboard/workspace-header";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { TodayEvents } from "@/components/dashboard/today-events";
import { ProductivityStats } from "@/components/dashboard/productivity-stats";
import { WorkspaceActions } from "@/components/dashboard/workspace-actions";
import { NotificationCenter } from "@/components/dashboard/notification-center";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header Personalizado */}
        <WorkspaceHeader />

        {/* Seção "Meu Trabalho Hoje" - Prioridade Total */}
        <div className="space-y-6">
          <div className="h-[60vh]">
            <TodayTasks />
          </div>
          <div className="h-[35vh]">
            <TodayEvents />
          </div>
        </div>

        {/* Widgets Inteligentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ProductivityStats />
          <NotificationCenter />
          <div className="lg:col-span-1">
            <WorkspaceActions />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
