import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useWorkSituations, WorkSituation, WorkSituationFormData } from '@/hooks/use-work-situations';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Briefcase } from 'lucide-react';

const colorPresets = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280',
];

export default function WorkSituations() {
  const { allWorkSituations, isLoading, fetchAllWorkSituations, createWorkSituation, updateWorkSituation, deleteWorkSituation, toggleWorkSituationStatus } = useWorkSituations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkSituation | null>(null);
  const [formData, setFormData] = useState<WorkSituationFormData>({ nome: '', descricao: '', cor: '#6366f1', ordem: 0, ativo: true });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllWorkSituations();
  }, [fetchAllWorkSituations]);

  const handleOpenDialog = (item?: WorkSituation) => {
    if (item) {
      setSelectedItem(item);
      setFormData({ nome: item.nome, descricao: item.descricao || '', cor: item.cor, ordem: item.ordem, ativo: item.ativo });
    } else {
      setSelectedItem(null);
      setFormData({ nome: '', descricao: '', cor: '#6366f1', ordem: allWorkSituations.length, ativo: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast({ title: 'Erro', description: 'O nome é obrigatório.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      if (selectedItem) {
        await updateWorkSituation(selectedItem.id, formData);
        toast({ title: 'Sucesso', description: 'Situação trabalhista atualizada com sucesso!' });
      } else {
        await createWorkSituation(formData);
        toast({ title: 'Sucesso', description: 'Situação trabalhista criada com sucesso!' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteWorkSituation(id);
    toast({ title: 'Sucesso', description: 'Situação trabalhista removida com sucesso!' });
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    await toggleWorkSituationStatus(id, newStatus);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando situações trabalhistas...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Situações Trabalhistas</h1>
            <p className="text-muted-foreground">
              Gerencie as situações trabalhistas disponíveis para o cadastro de alunos
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Situação
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Situações Trabalhistas ({allWorkSituations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allWorkSituations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma situação trabalhista encontrada</p>
                <p className="text-sm mb-4">Crie a primeira situação para começar</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Situação
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {allWorkSituations.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: item.cor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{item.nome}</h3>
                            <Badge variant={item.ativo ? 'default' : 'secondary'}>
                              {item.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Ordem: {item.ordem}
                            </Badge>
                          </div>
                          {item.descricao && (
                            <p className="text-sm text-muted-foreground">
                              {item.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.ativo}
                          onCheckedChange={(checked) => handleToggleStatus(item.id, checked)}
                        />
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover situação trabalhista</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover a situação "{item.nome}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem ? 'Editar Situação Trabalhista' : 'Nova Situação Trabalhista'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input 
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                  placeholder="Nome da situação trabalhista" 
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.descricao || ''} 
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} 
                  placeholder="Descrição opcional" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="space-y-2">
                    <Input 
                      type="color" 
                      value={formData.cor} 
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })} 
                    />
                    <div className="flex flex-wrap gap-1">
                      {colorPresets.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border-2 border-border hover:border-primary"
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, cor: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ordem</Label>
                  <Input 
                    type="number" 
                    value={formData.ordem} 
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedItem ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
