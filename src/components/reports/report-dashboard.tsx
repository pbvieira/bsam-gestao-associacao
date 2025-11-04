import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  Calendar,
  Download,
  ShoppingCart,
  TrendingDown
} from 'lucide-react';
import { StudentsReport } from './students-report';
import { InventoryReport } from './inventory-report';
import { MovementsReport } from './movements-report';
import { PurchasesReport } from './purchases-report';
import { ABCAnalysis } from './abc-analysis';
import { ActivitiesReport } from './activities-report';
import { CategoryStatistics } from './category-statistics';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalInventoryItems: number;
  lowStockItems: number;
  totalAnnotations: number;
  recentActivities: number;
}

export function ReportDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', selectedPeriod],
    queryFn: async () => {
      // Get students stats
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, ativo');

      // Get inventory stats
      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('id, estoque_atual, estoque_minimo, ativo');

      // Get annotations stats
      const { data: annotationsData } = await supabase
        .from('student_annotations')
        .select('id, created_at');

      const totalStudents = studentsData?.length || 0;
      const activeStudents = studentsData?.filter(s => s.ativo).length || 0;
      const totalInventoryItems = inventoryData?.filter(i => i.ativo).length || 0;
      const lowStockItems = inventoryData?.filter(
        i => i.ativo && i.estoque_atual <= i.estoque_minimo
      ).length || 0;
      const totalAnnotations = annotationsData?.length || 0;
      
      // Recent activities (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivities = annotationsData?.filter(
        a => new Date(a.created_at) >= thirtyDaysAgo
      ).length || 0;

      return {
        totalStudents,
        activeStudents,
        totalInventoryItems,
        lowStockItems,
        totalAnnotations,
        recentActivities,
      } as DashboardStats;
    },
  });

  const StatCard = ({ title, value, description, icon: Icon, variant = 'default' }: {
    title: string;
    value: number;
    description: string;
    icon: any;
    variant?: 'default' | 'warning' | 'success';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Alunos"
          value={stats?.totalStudents || 0}
          description={`${stats?.activeStudents || 0} ativos`}
          icon={Users}
        />
        <StatCard
          title="Itens no Estoque"
          value={stats?.totalInventoryItems || 0}
          description={`${stats?.lowStockItems || 0} com estoque baixo`}
          icon={Package}
          variant={stats?.lowStockItems && stats.lowStockItems > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Anotações Registradas"
          value={stats?.totalAnnotations || 0}
          description={`${stats?.recentActivities || 0} nos últimos 30 dias`}
          icon={FileText}
        />
        <StatCard
          title="Atividades Recentes"
          value={stats?.recentActivities || 0}
          description="Últimos 30 dias"
          icon={TrendingUp}
        />
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="inventory">Estoque</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
          <TabsTrigger value="abc">Curva ABC</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <StudentsReport />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryReport />
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <MovementsReport />
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <PurchasesReport />
        </TabsContent>

        <TabsContent value="abc" className="space-y-4">
          <ABCAnalysis />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <ActivitiesReport />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryStatistics />
        </TabsContent>
      </Tabs>
    </div>
  );
}