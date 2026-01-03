import { useState } from "react";
import { Plus, HeartPulse, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useDiseaseTypes, DiseaseType } from "@/hooks/use-disease-types";

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export default function DiseaseTypes() {
  const {
    diseaseTypes,
    isLoading,
    createDiseaseType,
    updateDiseaseType,
    toggleStatus,
    deleteDiseaseType,
    isCreating,
    isUpdating,
  } = useDiseaseTypes();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DiseaseType | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    informacao_adicional: "",
    cor: "#ef4444",
    ordem: 0,
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      descricao: "",
      informacao_adicional: "",
      cor: "#ef4444",
      ordem: diseaseTypes.length,
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: DiseaseType) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nome: item.nome,
        descricao: item.descricao || "",
        informacao_adicional: item.informacao_adicional || "",
        cor: item.cor,
        ordem: item.ordem,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      updateDiseaseType({ id: editingItem.id, ...formData });
    } else {
      createDiseaseType(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const activeCount = diseaseTypes.filter((d) => d.ativo).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tipos de Doenças</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de doenças para registro no histórico de saúde dos alunos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Editar Tipo de Doença" : "Novo Tipo de Doença"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="informacao_adicional">Informação Adicional</Label>
                  <Textarea
                    id="informacao_adicional"
                    value={formData.informacao_adicional}
                    onChange={(e) => setFormData({ ...formData, informacao_adicional: e.target.value })}
                    placeholder="Exibida como tooltip na lista"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          formData.cor === color ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, cor: color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordem">Ordem</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating || isUpdating}>
                    {editingItem ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HeartPulse className="h-5 w-5" />
              <span>Tipos Cadastrados</span>
              <Badge variant="secondary" className="ml-2">
                {activeCount} ativo{activeCount !== 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : diseaseTypes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum tipo de doença cadastrado
              </p>
            ) : (
              <div className="divide-y">
                {diseaseTypes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: item.cor }}
                      />
                      <div>
                        <p className={`font-medium ${!item.ativo ? "text-muted-foreground" : ""}`}>
                          {item.nome}
                        </p>
                        {item.descricao && (
                          <p className="text-sm text-muted-foreground">{item.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Ordem: {item.ordem}
                      </Badge>
                      <Badge variant={item.ativo ? "default" : "secondary"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus({ id: item.id, ativo: !item.ativo })}
                      >
                        {item.ativo ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o tipo "{item.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDiseaseType(item.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
