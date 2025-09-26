import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ReportDashboard } from "@/components/reports/report-dashboard";

export default function Reports() {
  return (
    <ProtectedRoute module="reports">
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground">
              Relatórios e análises do sistema de gestão
            </p>
          </div>
          
          <ReportDashboard />
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}