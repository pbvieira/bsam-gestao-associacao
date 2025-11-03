import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCategoryStatistics, GroupingMode } from "@/hooks/use-category-statistics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, Activity, FileText, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function CategoryStatistics() {
  const [mode, setMode] = useState<GroupingMode>('por_aluno');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { statistics, loading } = useCategoryStatistics(
    startDate,
    endDate,
    mode
  );

  const totalValue = statistics.reduce((sum, stat) => {
    return sum + (mode === 'por_aluno' ? (stat.total_alunos || 0) : (stat.total_atividades || 0));
  }, 0);

  const chartData = statistics.map(stat => ({
    name: stat.categoria,
    value: mode === 'por_aluno' ? stat.total_alunos : stat.total_atividades,
    cor: stat.cor
  }));

  return (
    <div className="space-y-6">
      {/* Header with mode selector */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Estatísticas por Categoria
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize atividades agrupadas por categoria de anotação
              </p>
            </div>
            
            <Tabs value={mode} onValueChange={(v) => setMode(v as GroupingMode)} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="por_aluno" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Por Aluno
                </TabsTrigger>
                <TabsTrigger value="total_geral" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Geral
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="start-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Inicial
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end-date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data Final
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <StatsGrid>
        <StatsCard
          title={mode === 'por_aluno' ? 'Total de Alunos' : 'Total de Atividades'}
          value={totalValue}
          icon={mode === 'por_aluno' ? Users : Activity}
          colorClass="text-primary"
          description={`${statistics.length} categorias com registros`}
        />
        <StatsCard
          title="Categorias Ativas"
          value={statistics.length}
          icon={FileText}
          colorClass="text-accent"
          description="Com pelo menos 1 registro"
        />
        {statistics.length > 0 && (
          <>
            <StatsCard
              title="Categoria com Mais Registros"
              value={statistics[0]?.categoria || '-'}
              icon={Activity}
              colorClass="text-success"
              description={`${mode === 'por_aluno' ? statistics[0]?.total_alunos : statistics[0]?.total_atividades} ${mode === 'por_aluno' ? 'alunos' : 'atividades'}`}
            />
            <StatsCard
              title="Período Analisado"
              value={`${format(new Date(startDate), 'dd/MM')} - ${format(new Date(endDate), 'dd/MM')}`}
              icon={Calendar}
              colorClass="text-muted-foreground"
              description={format(new Date(startDate), 'MMM yyyy')}
            />
          </>
        )}
      </StatsGrid>

      {/* Chart */}
      {!loading && statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gráfico de {mode === 'por_aluno' ? 'Alunos' : 'Atividades'} por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  className="text-xs"
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Table */}
      {!loading && statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.map((stat) => (
                <div
                  key={stat.categoria}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stat.cor }}
                    />
                    <span className="font-medium">{stat.categoria}</span>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {mode === 'por_aluno' ? stat.total_alunos : stat.total_atividades}
                    {' '}
                    {mode === 'por_aluno' ? 'alunos' : 'atividades'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && statistics.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma atividade encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Tente ajustar o período de datas
            </p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              <span className="text-muted-foreground">Carregando estatísticas...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
