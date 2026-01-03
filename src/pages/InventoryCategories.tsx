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
import { useInventoryCategories } from '@/hooks/use-inventory-categories';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Edit, Trash2, Package } from 'lucide-react';

const colorPresets = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280',
];

interface CategoryFormData {
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export default function InventoryCategories() {
  const { categories, loading, fetchAllCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useInventoryCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formData, setFormData] = useState<CategoryFormData>({ nome: '', descricao: '', cor: '#6366f1', ordem: 0, ativo: true });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllCategories();
  }, []);

  const handleOpenDialog = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      setFormData({ nome: item.nome, descricao: item.descricao || '', cor: item.cor, ordem: item.ordem, ativo: item.ativo });
    } else {
      setSelectedItem(null);
      setFormData({ nome: '', descricao: '', cor: '#6366f1', ordem: categories.length, ativo: true });
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
        await updateCategory(selectedItem.id, formData);
        toast({ title: 'Sucesso', description: 'Categoria atualizada com sucesso!' });
      } else {
        await createCategory({
          nome: formData.nome,
          descricao: formData.descricao || null,
          cor: formData.cor,
          ordem: formData.ordem,
          ativo: formData.ativo,
        });
        toast({ title: 'Sucesso', description: 'Categoria criada com sucesso!' });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Erro', description: 'Ocorreu um erro ao salvar.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    toast({ title: 'Sucesso', description: 'Categoria removida com sucesso!' });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleCategoryStatus(id, currentStatus);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias de Inventário</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias para organizar os itens do estoque
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Categorias ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma categoria encontrada</p>
                <p className="text-sm mb-4">Crie a primeira categoria para começar</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((item) => (
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
                          onCheckedChange={() => handleToggleStatus(item.id, item.ativo)}
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
                              <AlertDialogTitle>Remover categoria</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover a categoria "{item.nome}"? 
                                Esta ação não pode ser desfeita. Categorias em uso não podem ser excluídas.
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
                {selectedItem ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input 
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                  placeholder="Nome da categoria" 
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.descricao} 
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
