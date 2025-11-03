import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useStudentChildren } from '@/hooks/use-student-children';
import { useToast } from '@/hooks/use-toast';
import { ChildDialog } from './child-dialog';
import { Loader2, Users, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentChildrenTabProps {
  studentId?: string;
}

export function StudentChildrenTab({ studentId }: StudentChildrenTabProps) {
  const { children, loading, createChild, updateChild, deleteChild } = useStudentChildren(studentId);
  const { toast } = useToast();

  const handleCreateChild = async (childData: any) => {
    if (!studentId) {
      toast({
        title: 'Erro',
        description: 'Salve o aluno primeiro para adicionar filhos',
        variant: 'destructive',
      });
      return;
    }
    const result = await createChild(childData);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const handleUpdateChild = async (childData: any, childId: string) => {
    const result = await updateChild(childId, childData);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    const result = await deleteChild(childId);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Filho removido com sucesso!',
      });
    }
  };

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando filhos...</p>
        </CardContent>
      </Card>
    );
  }

  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filhos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Salve o aluno primeiro</p>
            <p className="text-sm">
              Para adicionar informações sobre filhos, primeiro salve os dados básicos do aluno.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filhos</CardTitle>
        <ChildDialog onSave={handleCreateChild} />
      </CardHeader>
      <CardContent>
        {children.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum filho cadastrado</p>
            <p className="text-sm mb-4">Adicione informações sobre os filhos deste aluno</p>
            <ChildDialog 
              onSave={handleCreateChild}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Filho
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{child.nome_completo}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {calculateAge(child.data_nascimento)} anos
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Nascimento: {format(new Date(child.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <ChildDialog 
                      child={child}
                      onSave={(data) => handleUpdateChild(data, child.id)}
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
                          <AlertDialogTitle>Remover filho</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {child.nome_completo}? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteChild(child.id)}
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
