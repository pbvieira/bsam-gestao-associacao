import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useStudentAnnotations } from '@/hooks/use-student-annotations';
import { useAnnotationCategories } from '@/hooks/use-annotation-categories';
import { useToast } from '@/hooks/use-toast';
import { AnnotationDialog } from './annotation-dialog';
import { Loader2, FileText, Edit, Trash2, Plus, Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentAnnotationsTabProps {
  studentId?: string;
}

export function StudentAnnotationsTab({ studentId }: StudentAnnotationsTabProps) {
  const { annotations, loading, createAnnotation, updateAnnotation, deleteAnnotation } = useStudentAnnotations(studentId);
  const { categories } = useAnnotationCategories();
  const { toast } = useToast();
  const [filterCategory, setFilterCategory] = useState<string>('all');

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
        description: 'Anotação removida com sucesso!',
      });
    }
  };

  const getCategoryColor = (categoria: string | null) => {
    if (!categoria) return '#6b7280';
    const category = categories.find(c => c.nome === categoria);
    return category?.cor || '#6b7280';
  };

  const filteredAnnotations = annotations.filter(annotation => {
    if (filterCategory !== 'all' && annotation.categoria !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando anotações...</p>
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
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
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
        </div>

        {filteredAnnotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {annotations.length === 0 ? 'Nenhuma anotação encontrada' : 'Nenhuma anotação com os filtros aplicados'}
            </p>
            <p className="text-sm mb-4">
              {annotations.length === 0 
                ? 'Adicione anotações para este aluno' 
                : 'Ajuste os filtros para ver outras anotações'
              }
            </p>
            {annotations.length === 0 && (
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
                    
                    <p className="font-medium mb-2">{annotation.descricao}</p>
                    
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
      </CardContent>
    </Card>
  );
}