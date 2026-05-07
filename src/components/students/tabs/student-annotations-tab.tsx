import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useStudentAnnotations } from '@/hooks/use-student-annotations';
import { useAnnotationCategories } from '@/hooks/use-annotation-categories';
import { useToast } from '@/hooks/use-toast';
import { AnnotationDialog } from './annotation-dialog';
import { Loader2, FileText, Edit, Trash2, Plus, Calendar, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentAnnotationsTabProps {
  studentId?: string;
}

export function StudentAnnotationsTab({ studentId }: StudentAnnotationsTabProps) {
  const { categories } = useAnnotationCategories();
  const { toast } = useToast();

  // Filtros
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [period, setPeriod] = useState<string>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterCategory, period, customFrom, customTo, pageSize, sortDir]);

  const { dateFrom, dateTo } = (() => {
    if (period === 'custom') {
      return { dateFrom: customFrom || undefined, dateTo: customTo || undefined };
    }
    if (period === 'all') return { dateFrom: undefined, dateTo: undefined };
    const days = period === '30' ? 30 : period === '90' ? 90 : period === '180' ? 180 : 0;
    if (!days) return { dateFrom: undefined, dateTo: undefined };
    const d = new Date();
    d.setDate(d.getDate() - days);
    return { dateFrom: d.toISOString().slice(0, 10), dateTo: undefined };
  })();

  const {
    annotations,
    total,
    totalAll,
    loading,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  } = useStudentAnnotations(studentId, {
    page,
    pageSize,
    search,
    categoria: filterCategory === 'all' ? '' : filterCategory,
    dateFrom,
    dateTo,
    sortDir,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = !!search || filterCategory !== 'all' || period !== 'all';

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setFilterCategory('all');
    setPeriod('all');
    setCustomFrom('');
    setCustomTo('');
    setPage(1);
  };

  const handleCreateAnnotation = async (annotationData: any) => {
    if (!studentId) {
      toast({
        title: 'Erro',
        description: 'Salve o aluno primeiro para adicionar anotações',
        variant: 'destructive',
      });
      return;
    }
    const result = await createAnnotation(annotationData);
    if (result?.error) throw new Error(result.error);
  };

  const handleUpdateAnnotation = async (annotationData: any, annotationId: string) => {
    const result = await updateAnnotation(annotationId, annotationData);
    if (result?.error) throw new Error(result.error);
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    const result = await deleteAnnotation(annotationId);
    if (result?.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Anotação removida com sucesso!' });
    }
  };

  const getCategoryColor = (categoria: string | null) => {
    if (!categoria) return '#6b7280';
    const category = categories.find(c => c.nome === categoria);
    return category?.cor || '#6b7280';
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Anotações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Salve o aluno primeiro</p>
            <p className="text-sm">
              Para adicionar anotações, primeiro salve os dados básicos do aluno.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Anotações</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico de anotações do aluno
          </p>
        </div>
        <AnnotationDialog onSave={handleCreateAnnotation} />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="space-y-3 pb-3 border-b">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou categoria..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.nome}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.cor }}
                        />
                        {category.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="180">Últimos 6 meses</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as 'asc' | 'desc')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mais recentes</SelectItem>
                  <SelectItem value="asc">Mais antigos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {period === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">De</label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Até</label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            </div>
          )}

          {hasFilters && (
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
          <span>
            Exibindo: <strong className="text-foreground">{annotations.length}</strong> de{' '}
            <strong className="text-foreground">{total}</strong>
            {hasFilters && totalAll !== total && (
              <> (total geral: {totalAll})</>
            )}
          </span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando anotações...</span>
          </div>
        )}

        {!loading && annotations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {hasFilters ? 'Nenhuma anotação com os filtros aplicados' : 'Nenhuma anotação encontrada'}
            </p>
            <p className="text-sm mb-4">
              {hasFilters ? 'Ajuste os filtros para ver outras anotações' : 'Adicione anotações para este aluno'}
            </p>
            {!hasFilters && totalAll === 0 && (
              <AnnotationDialog
                onSave={handleCreateAnnotation}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Anotação
                  </Button>
                }
              />
            )}
          </div>
        )}

        {!loading && annotations.length > 0 && (
          <div className="space-y-4">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {annotation.categoria && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${getCategoryColor(annotation.categoria)}20`,
                            borderColor: getCategoryColor(annotation.categoria),
                            color: getCategoryColor(annotation.categoria)
                          }}
                        >
                          {annotation.categoria}
                        </Badge>
                      )}
                    </div>

                    <p className="font-medium mb-2 whitespace-pre-wrap">{annotation.descricao}</p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(annotation.data_evento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <AnnotationDialog
                      annotation={annotation}
                      onSave={(data) => handleUpdateAnnotation(data, annotation.id)}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover anotação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover esta anotação?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAnnotation(annotation.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Itens por página:</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((p, idx) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`e-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
