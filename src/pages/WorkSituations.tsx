import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useWorkSituations, WorkSituation, WorkSituationFormData } from '@/hooks/use-work-situations';
import { Plus, Pencil, Trash2, Loader2, Briefcase } from 'lucide-react';

export default function WorkSituations() {
  const { allWorkSituations, isLoading, fetchAllWorkSituations, createWorkSituation, updateWorkSituation, deleteWorkSituation, toggleWorkSituationStatus } = useWorkSituations();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkSituation | null>(null);
  const [deletingItem, setDeletingItem] = useState<WorkSituation | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<WorkSituationFormData>({
    nome: '',
    descricao: '',
    cor: '#6366f1',
    ordem: 0,
    ativo: true
  });

  useEffect(() => {
    fetchAllWorkSituations();
  }, [fetchAllWorkSituations]);

  const handleOpenModal = (item?: WorkSituation) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome,
        descricao: item.descricao || '',
        cor: item.cor,
        ordem: item.ordem,
        ativo: item.ativo
      });
    } else {
      setEditingItem(null);
      setFormData({
        nome: '',
        descricao: '',
        cor: '#6366f1',
        ordem: allWorkSituations.length + 1,
        ativo: true
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'O nome é obrigatório.',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editingItem) {
        await updateWorkSituation(editingItem.id, formData);
        toast({
          title: 'Sucesso',
          description: 'Situação trabalhista atualizada com sucesso.'
        });
      } else {
        await createWorkSituation(formData);
        toast({
          title: 'Sucesso',
          description: 'Situação trabalhista criada com sucesso.'
        });
      }
      handleCloseModal();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar situação trabalhista.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    try {
      await deleteWorkSituation(deletingItem.id);
      toast({
        title: 'Sucesso',
        description: 'Situação trabalhista excluída com sucesso.'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir situação trabalhista.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  const handleToggleStatus = async (item: WorkSituation) => {
    try {
      await toggleWorkSituationStatus(item.id, !item.ativo);
      toast({
        title: 'Sucesso',
        description: `Situação trabalhista ${item.ativo ? 'desativada' : 'ativada'} com sucesso.`
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar status.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Situações Trabalhistas</h1>
          <p className="text-muted-foreground">Gerencie as situações trabalhistas disponíveis para o cadastro de alunos.</p>
        </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Situações Trabalhistas
          </CardTitle>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allWorkSituations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.ordem}</TableCell>
                  <TableCell className="font-medium">{item.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{item.descricao || '-'}</TableCell>
                  <TableCell>
                    <div
                      className="h-6 w-6 rounded-full border"
                      style={{ backgroundColor: item.cor }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.ativo}
                      onCheckedChange={() => handleToggleStatus(item)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleOpenModal(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setDeletingItem(item);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {allWorkSituations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma situação trabalhista cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Situação Trabalhista' : 'Nova Situação Trabalhista'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Edite os dados da situação trabalhista.' : 'Preencha os dados da nova situação trabalhista.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da situação trabalhista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a situação trabalhista "{deletingItem?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MainLayout>
  );
}
