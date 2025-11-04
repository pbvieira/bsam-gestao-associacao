import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useInventoryCategories } from "@/hooks/use-inventory-categories";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const categorySchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor inválida"),
  ordem: z.number().int().min(0, "Ordem deve ser positiva"),
  ativo: z.boolean(),
});

type CategoryForm = z.infer<typeof categorySchema>;

const colorPresets = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#6b7280"
];

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any;
  onSave: (data: CategoryForm) => Promise<void>;
}

const CategoryDialog = ({ open, onOpenChange, category, onSave }: CategoryDialogProps) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      nome: category.nome,
      descricao: category.descricao || "",
      cor: category.cor,
      ordem: category.ordem,
      ativo: category.ativo,
    } : {
      nome: "",
      descricao: "",
      cor: "#6366f1",
      ordem: 0,
      ativo: true,
    },
  });

  const selectedColor = watch("cor");
  const isActive = watch("ativo");

  const onSubmit = async (data: CategoryForm) => {
    await onSave(data);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{category ? "Editar" : "Nova"} Categoria</DialogTitle>
          <DialogDescription>
            {category ? "Atualize" : "Crie uma nova"} categoria para organizar os itens do inventário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              {...register("nome")}
              placeholder="Ex: Eletrônicos"
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register("descricao")}
              placeholder="Descrição opcional da categoria"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                {...register("cor")}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={selectedColor}
                onChange={(e) => setValue("cor", e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
            <div className="grid grid-cols-9 gap-2 mt-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("cor", color)}
                  className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "hsl(var(--primary))" : "transparent",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem de Exibição</Label>
            <Input
              id="ordem"
              type="number"
              {...register("ordem", { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.ordem && (
              <p className="text-sm text-destructive">{errors.ordem.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Categoria Ativa</Label>
            <Switch
              id="ativo"
              checked={isActive}
              onCheckedChange={(checked) => setValue("ativo", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {category ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function InventoryCategories() {
  const { categories, loading, fetchAllCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus } = useInventoryCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleOpenDialog = (category?: any) => {
    setSelectedCategory(category || null);
    setDialogOpen(true);
  };

  const handleSaveCategory = async (data: CategoryForm) => {
    if (selectedCategory) {
      await updateCategory(selectedCategory.id, data);
    } else {
      await createCategory({
        nome: data.nome,
        descricao: data.descricao || null,
        cor: data.cor,
        ordem: data.ordem,
        ativo: data.ativo,
      });
    }
  };

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  useState(() => {
    fetchAllCategories();
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
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
            <h1 className="text-3xl font-bold">Categorias de Inventário</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as categorias para organizar os itens do estoque
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categorias Cadastradas</CardTitle>
            <CardDescription>
              {categories.length} {categories.length === 1 ? 'categoria' : 'categorias'} no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.cor }}
                    >
                      <Tag className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{category.nome}</h3>
                        <span className="text-sm text-muted-foreground">
                          (Ordem: {category.ordem})
                        </span>
                      </div>
                      {category.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.descricao}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.ativo}
                      onCheckedChange={() => toggleCategoryStatus(category.id, category.ativo)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {categories.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma categoria cadastrada. Crie a primeira categoria para começar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <CategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={selectedCategory}
          onSave={handleSaveCategory}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                Categorias em uso não podem ser excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
