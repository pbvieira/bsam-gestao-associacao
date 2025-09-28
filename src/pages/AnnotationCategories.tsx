import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAnnotationCategories } from '@/hooks/use-annotation-categories';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit, Trash2, Tag, Palette } from 'lucide-react';

const categorySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
  ordem: z.number().min(0, 'Ordem deve ser um número positivo'),
  ativo: z.boolean().default(true),
});

type CategoryForm = z.infer<typeof categorySchema>;

const colorPresets = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
];

function CategoryDialog({ category, onSave }: { category?: any; onSave: (data: CategoryForm) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nome: category?.nome || '',
      descricao: category?.descricao || '',
      cor: category?.cor || '#6366f1',
      ordem: category?.ordem || 0,
      ativo: category?.ativo !== false,
    },
  });

  const onSubmit = async (data: CategoryForm) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast({
        title: 'Sucesso',
        description: `Categoria ${category ? 'atualizada' : 'criada'} com sucesso!`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a categoria.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {category ? (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da categoria..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição da categoria..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input type="color" {...field} />
                        <div className="flex flex-wrap gap-1">
                          {colorPresets.map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-6 h-6 rounded border-2 border-border hover:border-primary"
                              style={{ backgroundColor: color }}
                              onClick={() => field.onChange(color)}
                            />
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Categoria Ativa</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Desative para ocultar a categoria dos formulários
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {category ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AnnotationCategories() {
  const { fetchAllCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useAnnotationCategories();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await fetchAllCategories();
    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive',
      });
    } else {
      setCategories(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (data: CategoryForm) => {
    const result = await createCategory({
      nome: data.nome,
      descricao: data.descricao || null,
      cor: data.cor,
      ativo: data.ativo,
      ordem: data.ordem,
    });
    if (result?.error) {
      throw new Error(result.error);
    }
    await loadCategories();
  };

  const handleUpdateCategory = async (data: CategoryForm, categoryId: string) => {
    const result = await updateCategory(categoryId, data);
    if (result?.error) {
      throw new Error(result.error);
    }
    await loadCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const result = await deleteCategory(categoryId);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Categoria removida com sucesso!',
      });
      await loadCategories();
    }
  };

  const handleToggleStatus = async (categoryId: string, newStatus: boolean) => {
    const result = await toggleCategoryStatus(categoryId, newStatus);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      await loadCategories();
    }
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
            <h1 className="text-3xl font-bold tracking-tight">Categorias de Anotações</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias disponíveis para as anotações dos alunos
            </p>
          </div>
          <CategoryDialog onSave={handleCreateCategory} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categorias ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma categoria encontrada</p>
                <p className="text-sm mb-4">Crie a primeira categoria para começar</p>
                <CategoryDialog onSave={handleCreateCategory} />
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.cor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{category.nome}</h3>
                            <Badge variant={category.ativo ? 'default' : 'secondary'}>
                              {category.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Ordem: {category.ordem}
                            </Badge>
                          </div>
                          {category.descricao && (
                            <p className="text-sm text-muted-foreground">
                              {category.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.ativo}
                          onCheckedChange={(checked) => handleToggleStatus(category.id, checked)}
                        />
                        <CategoryDialog 
                          category={category}
                          onSave={(data) => handleUpdateCategory(data, category.id)}
                        />
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
                                Tem certeza que deseja remover a categoria "{category.nome}"? 
                                Esta ação não pode ser desfeita e não será possível se houver anotações associadas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id)}
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
      </div>
    </MainLayout>
  );
}