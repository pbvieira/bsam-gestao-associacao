import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Download, Calendar as CalendarIcon, Activity, Users, List } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityReportData {
  id: string;
  categoria: string;
  descricao: string;
  data_evento: string;
  created_at: string;
  student_id: string;
  student_name: string;
  student_code: string;
  created_by_name: string;
}

export function ActivitiesReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [groupingMode, setGroupingMode] = useState<'list' | 'by_student'>('list');

  // Buscar categorias disponíveis
  const { data: categories } = useQuery({
    queryKey: ['annotation-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('annotation_categories')
        .select('nome')
        .eq('ativo', true)
        .order('ordem', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities-report', searchTerm, categoryFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('student_annotations')
        .select(`
          *,
          students (
            nome_completo,
            codigo_cadastro
          )
        `);

      if (searchTerm) {
        query = query.or(
          `descricao.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`
        );
      }

      if (categoryFilter !== 'all') {
        query = query.eq('categoria', categoryFilter);
      }

      if (dateFrom) {
        query = query.gte('data_evento', format(dateFrom, 'yyyy-MM-dd'));
      }

      if (dateTo) {
        query = query.lte('data_evento', format(dateTo, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('data_evento', { ascending: false }).limit(500);
      if (error) throw error;

      // Get created_by profiles separately to avoid relation issues
      const userIds = [...new Set(data?.map(activity => activity.created_by).filter(Boolean))];
      let profilesData = [];
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        profilesData = profiles || [];
      }

      return data?.map(activity => ({
        ...activity,
        student_id: activity.student_id,
        student_name: activity.students?.nome_completo || 'Aluno não encontrado',
        student_code: activity.students?.codigo_cadastro || '',
        created_by_name: profilesData.find(p => p.user_id === activity.created_by)?.full_name || 'Usuário não encontrado',
      })) as ActivityReportData[];
    },
  });

  // Agrupar dados por aluno
  const groupedByStudent = activities?.reduce((acc, activity) => {
    const studentId = activity.student_id;
    if (!acc[studentId]) {
      acc[studentId] = {
        student_name: activity.student_name,
        student_code: activity.student_code,
        activities: [],
        total: 0
      };
    }
    acc[studentId].activities.push(activity);
    acc[studentId].total += 1;
    return acc;
  }, {} as Record<string, { student_name: string; student_code: string; activities: ActivityReportData[]; total: number }>);

  const handleExport = () => {
    if (!activities) return;

    const csv = [
      ['Data', 'Aluno', 'Código', 'Categoria', 'Descrição', 'Responsável'].join(','),
      ...activities.map(activity => [
        new Date(activity.data_evento).toLocaleDateString('pt-BR'),
        activity.student_name,
        activity.student_code,
        activity.categoria || '',
        activity.descricao.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        activity.created_by_name
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_atividades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Relatório de Atividades
            </CardTitle>
            <CardDescription>
              Visualizar atividades e anotações registradas no sistema
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <Tabs value={groupingMode} onValueChange={(v) => setGroupingMode(v as 'list' | 'by_student')}>
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista Completa
              </TabsTrigger>
              <TabsTrigger value="by_student" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Agrupado por Aluno
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar atividades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.nome} value={category.nome}>
                    {category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhuma atividade encontrada.' : 'Nenhuma atividade registrada ainda.'}
            </p>
          </div>
        ) : groupingMode === 'list' ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      {new Date(activity.data_evento).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{activity.student_name}</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {activity.student_code}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.categoria && (
                        <Badge variant="outline">{activity.categoria}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate" title={activity.descricao}>
                        {activity.descricao}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {activity.created_by_name}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedByStudent || {})
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([studentId, data]) => (
                <Card key={studentId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{data.student_name}</CardTitle>
                        <CardDescription className="font-mono">{data.student_code}</CardDescription>
                      </div>
                      <Badge variant="secondary">{data.total} atividades</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {new Date(activity.data_evento).toLocaleDateString('pt-BR')}
                              </span>
                              {activity.categoria && (
                                <Badge variant="outline" className="text-xs">{activity.categoria}</Badge>
                              )}
                            </div>
                            <p className="text-sm">{activity.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              Por: {activity.created_by_name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {activities && activities.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              {groupingMode === 'list' 
                ? `Mostrando ${activities.length} atividade${activities.length !== 1 ? 's' : ''}`
                : `${Object.keys(groupedByStudent || {}).length} alunos com atividades`
              }
            </p>
            {(dateFrom || dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
              >
                Limpar Filtros de Data
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
