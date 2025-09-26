import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useStudentAnnotations } from '@/hooks/use-student-annotations';
import { useToast } from '@/hooks/use-toast';
import { AnnotationDialog } from './annotation-dialog';
import { Loader2, FileText, DollarSign, Edit, Trash2, Plus, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentAnnotationsTabProps {
  studentId?: string;
}

export function StudentAnnotationsTab({ studentId }: StudentAnnotationsTabProps) {
  const { annotations, loading, createAnnotation, updateAnnotation, deleteAnnotation } = useStudentAnnotations(studentId);
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleCreateAnnotation = async (annotationData: any) => {
    const result = await createAnnotation(annotationData);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const handleUpdateAnnotation = async (annotationData: any, annotationId: string) => {
    const result = await updateAnnotation(annotationId, annotationData);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    const result = await deleteAnnotation(annotationId);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Registro removido com sucesso!',
      });
    }
  };

  const getCategoryLabel = (categoria: string | null) => {
    const labels: Record<string, string> = {
      atendimento: 'Atendimento',
      curso: 'Curso',
      entrega_item: 'Entrega de Item',
      compra: 'Compra',
      outros: 'Outros',
    };
    return categoria ? labels[categoria] || categoria : 'Sem categoria';
  };

  const filteredAnnotations = annotations.filter(annotation => {
    if (filterType !== 'all' && annotation.tipo !== filterType) return false;
    if (filterCategory !== 'all' && annotation.categoria !== filterCategory) return false;
    return true;
  });

  const totalGastos = annotations
    .filter(a => a.tipo === 'gasto' && a.valor)
    .reduce((sum, a) => sum + (a.valor || 0), 0);

  if (!studentId) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Selecione um aluno para gerenciar anotações e histórico</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Anotações e Histórico</CardTitle>
          {totalGastos > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              Total de gastos: <span className="font-semibold text-destructive">R$ {totalGastos.toFixed(2)}</span>
            </div>
          )}
        </div>
        <AnnotationDialog onSave={handleCreateAnnotation} />
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="anotacao">Anotações</SelectItem>
                <SelectItem value="gasto">Gastos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filterType === 'anotacao' && (
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="atendimento">Atendimento</SelectItem>
                <SelectItem value="curso">Curso</SelectItem>
                <SelectItem value="entrega_item">Entrega de Item</SelectItem>
                <SelectItem value="compra">Compra</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {filteredAnnotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {annotations.length === 0 ? 'Nenhum registro encontrado' : 'Nenhum registro com os filtros aplicados'}
            </p>
            <p className="text-sm mb-4">
              {annotations.length === 0 
                ? 'Adicione anotações e gastos para este aluno' 
                : 'Ajuste os filtros para ver outros registros'
              }
            </p>
            {annotations.length === 0 && (
              <AnnotationDialog 
                onSave={handleCreateAnnotation}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Registro
                  </Button>
                }
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnotations.map((annotation) => (
              <div
                key={annotation.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {annotation.tipo === 'anotacao' ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-destructive" />
                      )}
                      
                      <Badge variant={annotation.tipo === 'anotacao' ? 'default' : 'destructive'}>
                        {annotation.tipo === 'anotacao' ? 'Anotação' : 'Gasto'}
                      </Badge>
                      
                      {annotation.categoria && (
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(annotation.categoria)}
                        </Badge>
                      )}
                      
                      {annotation.valor && (
                        <Badge variant="outline" className="text-xs">
                          R$ {annotation.valor.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="font-medium mb-2">{annotation.descricao}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(annotation.data_evento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      
                      {annotation.data_agendamento && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Agendado: {format(new Date(annotation.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {annotation.observacoes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        {annotation.observacoes}
                      </p>
                    )}
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
                          <AlertDialogTitle>Remover registro</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover este registro? 
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
      </CardContent>
    </Card>
  );
}