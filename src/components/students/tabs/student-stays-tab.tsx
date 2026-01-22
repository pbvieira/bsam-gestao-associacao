import { useState } from 'react';
import { useStudentStays, MOTIVOS_SAIDA } from '@/hooks/use-student-stays';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid, differenceInDays, differenceInYears, differenceInMonths, addYears, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { History, Calendar, Clock, Edit, Trash2, Plus } from 'lucide-react';

interface StudentStaysTabProps {
  studentId: string | null;
}

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '-';
  } catch {
    return '-';
  }
};

const calculatePermanencia = (dataEntrada: string, dataSaida: string): string => {
  const inicio = parseISO(dataEntrada);
  const fim = parseISO(dataSaida);
  
  if (!isValid(inicio) || !isValid(fim)) return '-';
  
  const totalDias = differenceInDays(fim, inicio);
  
  if (totalDias < 0) return 'Data inválida';
  if (totalDias === 0) return '1 dia';
  if (totalDias === 1) return '1 dia';
  if (totalDias < 30) return `${totalDias} dias`;
  
  const anos = differenceInYears(fim, inicio);
  const mesesTotais = differenceInMonths(fim, inicio);
  const meses = mesesTotais % 12;
  
  let dataAposMeses = addYears(inicio, anos);
  dataAposMeses = addMonths(dataAposMeses, meses);
  const diasRestantes = differenceInDays(fim, dataAposMeses);
  
  let result = '';
  
  if (anos > 0) {
    result = `${anos}a`;
  }
  
  if (meses > 0) {
    if (result) result += ' ';
    result += `${meses}m`;
  }
  
  if (diasRestantes > 0) {
    if (result) result += ' ';
    result += `${diasRestantes}d`;
  }
  
  return result || '1 dia';
};

export function StudentStaysTab({ studentId }: StudentStaysTabProps) {
  const { stays, loading, getMotivoLabel, updateStay, deleteStay } = useStudentStays(studentId);
  const { canAccess } = useAuth();
  const { toast } = useToast();
  
  const [editingStay, setEditingStay] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    motivo_saida: '',
    observacoes: '',
  });

  const canEdit = canAccess("students");

  const handleEdit = (stay: any) => {
    setEditingStay(stay);
    setEditForm({
      motivo_saida: stay.motivo_saida || '',
      observacoes: stay.observacoes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingStay) return;
    
    const result = await updateStay(editingStay.id, editForm);
    if (result.error) {
      toast({
        title: 'Erro ao atualizar',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Registro de estadia atualizado.',
      });
      setEditingStay(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    const result = await deleteStay(deleteConfirmId);
    if (result.error) {
      toast({
        title: 'Erro ao excluir',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Registro de estadia excluído.',
      });
    }
    setDeleteConfirmId(null);
  };

  // Calculate total days across all stays
  const totalDiasHistorico = stays.reduce((acc, stay) => {
    const dias = differenceInDays(parseISO(stay.data_saida), parseISO(stay.data_entrada));
    return acc + (dias > 0 ? dias : 0);
  }, 0);

  if (!studentId) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Salve o cadastro do aluno para visualizar o histórico de estadias.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estadias Anteriores</p>
                <p className="text-2xl font-bold">{stays.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Dias (Histórico)</p>
                <p className="text-2xl font-bold">{totalDiasHistorico}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stays Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Estadias
          </CardTitle>
          <CardDescription>
            Registro de todas as estadias anteriores do aluno na associação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stays.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma estadia anterior</h3>
              <p className="text-muted-foreground">
                O histórico será preenchido automaticamente quando o aluno for reativado após uma saída.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Permanência</TableHead>
                    <TableHead>Motivo Saída</TableHead>
                    <TableHead>Observações</TableHead>
                    {canEdit && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stays.map((stay) => (
                    <TableRow key={stay.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(stay.data_entrada)}</div>
                          {stay.hora_entrada && (
                            <div className="text-xs text-muted-foreground">{stay.hora_entrada}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatDate(stay.data_saida)}</div>
                          {stay.hora_saida && (
                            <div className="text-xs text-muted-foreground">{stay.hora_saida}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {calculatePermanencia(stay.data_entrada, stay.data_saida)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getMotivoLabel(stay.motivo_saida)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-muted-foreground">
                          {stay.observacoes || '-'}
                        </p>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(stay)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(stay.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingStay} onOpenChange={() => setEditingStay(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Registro de Estadia</DialogTitle>
            <DialogDescription>
              Altere as informações do registro de estadia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo da Saída</Label>
              <Select
                value={editForm.motivo_saida}
                onValueChange={(value) => setEditForm({ ...editForm, motivo_saida: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_SAIDA.map((motivo) => (
                    <SelectItem key={motivo.value} value={motivo.value}>
                      {motivo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={editForm.observacoes}
                onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                placeholder="Observações sobre a estadia..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStay(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Registro de Estadia</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de estadia? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
