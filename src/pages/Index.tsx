import { MainLayout } from "@/components/layout/main-layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { QuickActions } from "@/components/dashboard/quick-actions";

const Index = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de gestão - O Bom Samaritano
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions />
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <RecentActivities />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
