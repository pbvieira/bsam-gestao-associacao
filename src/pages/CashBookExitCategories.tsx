import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCashBookExitCategories, CashBookExitCategory, CashBookExitCategoryFormData } from '@/hooks/use-cash-book-exit-categories';

const CashBookExitCategories = () => {
  const { allCategories, isLoading, fetchAllCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useCashBookExitCategories();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CashBookExitCategory | null>(null);
  const [formData, setFormData] = useState<CashBookExitCategoryFormData>({ nome: '', descricao: '', cor: '#ef4444', ordem: 0 });

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleOpenDialog = (item?: CashBookExitCategory) => {
    if (item) {
      setSelectedItem(item);
      setFormData({ nome: item.nome, descricao: item.descricao || '', cor: item.cor, ordem: item.ordem });
    } else {
      setSelectedItem(null);
      setFormData({ nome: '', descricao: '', cor: '#ef4444', ordem: allCategories.length });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    const success = selectedItem
      ? await updateCategory(selectedItem.id, formData)
      : await createCategory(formData);
    if (success) setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (selectedItem) {
      await deleteCategory(selectedItem.id);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    }
  };

  return (
    <MainLayout>
      <PageLayout
        title="Categorias de Saída"
        subtitle="Gerencie as categorias de saída do livro caixa dos alunos"
        actionButton={
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        }
      >
        <div className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Carregando...</CardContent></Card>
          ) : allCategories.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma categoria de saída cadastrada</CardContent></Card>
          ) : (
            allCategories.map((item) => (
              <Card key={item.id} className={!item.ativo ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.cor }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.nome}</span>
                          <Badge variant={item.ativo ? 'default' : 'secondary'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge>
                          <Badge variant="outline">Ordem: {item.ordem}</Badge>
                        </div>
                        {item.descricao && <p className="text-sm text-muted-foreground mt-1">{item.descricao}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={item.ativo} onCheckedChange={(checked) => toggleCategoryStatus(item.id, checked)} />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setIsDeleteDialogOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedItem ? 'Editar Categoria de Saída' : 'Nova Categoria de Saída'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome da categoria" /></div>
              <div><Label>Descrição</Label><Textarea value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} placeholder="Descrição opcional" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cor</Label><Input type="color" value={formData.cor} onChange={(e) => setFormData({ ...formData, cor: e.target.value })} className="h-10 cursor-pointer" /></div>
                <div><Label>Ordem</Label><Input type="number" value={formData.ordem} onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formData.nome.trim()}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>Tem certeza que deseja excluir a categoria "{selectedItem?.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageLayout>
    </MainLayout>
  );
};

export default CashBookExitCategories;
