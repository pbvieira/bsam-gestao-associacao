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
import { Search, Download, Filter, Calendar } from 'lucide-react';

interface StudentReportData {
  id: string;
  nome_completo: string;
  codigo_cadastro: string;
  data_nascimento: string;
  data_abertura: string;
  ativo: boolean;
  annotations_count: number;
  last_activity: string | null;
}

export function StudentsReport() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nome_completo');

  const { data: students, isLoading } = useQuery({
    queryKey: ['students-report', searchTerm, statusFilter, sortBy],
    queryFn: async () => {
      let query = supabase
        .from('students')
        .select(`
          id,
          nome_completo,
          codigo_cadastro,
          data_nascimento,
          data_abertura,
          ativo,
          student_annotations (
            id,
            created_at
          )
        `);

      if (searchTerm) {
        query = query.or(
          `nome_completo.ilike.%${searchTerm}%,codigo_cadastro.ilike.%${searchTerm}%`
        );
      }

      if (statusFilter !== 'all') {
        query = query.eq('ativo', statusFilter === 'active');
      }

      const { data, error } = await query.order(sortBy, { ascending: true });
      if (error) throw error;

      // Process data to include annotations count and last activity
      return data?.map(student => ({
        ...student,
        annotations_count: student.student_annotations?.length || 0,
        last_activity: student.student_annotations && student.student_annotations.length > 0
          ? student.student_annotations.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0].created_at
          : null,
      })) as StudentReportData[];
    },
  });

  const handleExport = () => {
    if (!students) return;

    const csv = [
      ['Código', 'Nome', 'Data Nascimento', 'Data Cadastro', 'Status', 'Anotações', 'Última Atividade'].join(','),
      ...students.map(student => [
        student.codigo_cadastro,
        student.nome_completo,
        new Date(student.data_nascimento).toLocaleDateString('pt-BR'),
        new Date(student.data_abertura).toLocaleDateString('pt-BR'),
        student.ativo ? 'Ativo' : 'Inativo',
        student.annotations_count,
        student.last_activity 
          ? new Date(student.last_activity).toLocaleDateString('pt-BR')
          : 'Nunca'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_alunos_${new Date().toISOString().split('T')[0]}.csv`);
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
            <CardTitle>Relatório de Alunos</CardTitle>
            <CardDescription>
              Visualizar dados detalhados dos alunos cadastrados
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nome_completo">Nome</SelectItem>
              <SelectItem value="codigo_cadastro">Código</SelectItem>
              <SelectItem value="data_abertura">Data Cadastro</SelectItem>
              <SelectItem value="data_nascimento">Data Nascimento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {!students || students.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data Nascimento</TableHead>
                  <TableHead>Data Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Anotações</TableHead>
                  <TableHead>Última Atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-sm">
                      {student.codigo_cadastro}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student.nome_completo}
                    </TableCell>
                    <TableCell>
                      {new Date(student.data_nascimento).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(student.data_abertura).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.ativo ? 'default' : 'secondary'}>
                        {student.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {student.annotations_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.last_activity 
                        ? new Date(student.last_activity).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {students && students.length > 0 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {students.length} aluno{students.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}