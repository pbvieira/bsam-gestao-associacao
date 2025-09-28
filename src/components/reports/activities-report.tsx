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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Download, Calendar as CalendarIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActivityReportData {
  id: string;
  tipo: string;
  categoria: string;
  descricao: string;
  data_evento: string;
  created_at: string;
  student_name: string;
  student_code: string;
  created_by_name: string;
}

export function ActivitiesReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities-report', searchTerm, typeFilter, dateFrom, dateTo],
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

      if (typeFilter !== 'all') {
        query = query.eq('tipo', typeFilter);
      }

      if (dateFrom) {
        query = query.gte('data_evento', format(dateFrom, 'yyyy-MM-dd'));
      }

      if (dateTo) {
        query = query.lte('data_evento', format(dateTo, 'yyyy-MM-dd'));
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(100);
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
        student_name: activity.students?.nome_completo || 'Aluno não encontrado',
        student_code: activity.students?.codigo_cadastro || '',
        created_by_name: profilesData.find(p => p.user_id === activity.created_by)?.full_name || 'Usuário não encontrado',
      })) as ActivityReportData[];
    },
  });

  const handleExport = () => {
    if (!activities) return;

    const csv = [
      ['Data', 'Aluno', 'Código', 'Tipo', 'Categoria', 'Descrição', 'Responsável'].join(','),
      ...activities.map(activity => [
        new Date(activity.data_evento).toLocaleDateString('pt-BR'),
        activity.student_name,
        activity.student_code,
        activity.tipo,
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

  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case 'geral':
        return <Badge variant="default">Geral</Badge>;
      case 'despesa':
        return <Badge variant="outline">Despesa</Badge>;
      default:
        return <Badge variant="secondary">{tipo}</Badge>;
    }
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
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
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
      </CardHeader>

      <CardContent>
        {!activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhuma atividade encontrada.' : 'Nenhuma atividade registrada ainda.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Tipo</TableHead>
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
                      {getTypeBadge(activity.tipo)}
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
        )}

        {activities && activities.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {activities.length} atividade{activities.length !== 1 ? 's' : ''} (últimas 100)
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