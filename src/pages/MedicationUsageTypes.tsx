import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Pill } from 'lucide-react';
import { useMedicationUsageTypes, MedicationUsageType } from '@/hooks/use-medication-usage-types';
import { toast } from 'sonner';

const COLOR_PRESETS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export default function MedicationUsageTypes() {
  const { types, loading, createType, updateType, toggleStatus, deleteType } = useMedicationUsageTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<MedicationUsageType | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#6366f1'
  });

  const handleOpenDialog = (type?: MedicationUsageType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        nome: type.nome,
        descricao: type.descricao || '',
        cor: type.cor
      });
    } else {
      setEditingType(null);
      setFormData({ nome: '', descricao: '', cor: '#6366f1' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const result = editingType
      ? await updateType(editingType.id, formData)
      : await createType(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(editingType ? 'Tipo atualizado' : 'Tipo criado');
      setIsDialogOpen(false);
    }
  };

  const handleToggleStatus = async (type: MedicationUsageType) => {
    const result = await toggleStatus(type.id, !type.ativo);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(type.ativo ? 'Tipo desativado' : 'Tipo ativado');
    }
  };

  const handleDelete = async (type: MedicationUsageType) => {
    if (!confirm(`Excluir "${type.nome}"?`)) return;
    
    const result = await deleteType(type.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Tipo excluído');
    }
  };

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tipos de Uso de Medicamentos</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de uso para classificação de medicamentos
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                Tipos de Uso ({types.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {types.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum tipo cadastrado
              </p>
            ) : (
              <div className="divide-y">
                {types.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.cor }}
                      />
                      <div>
                        <span className={`font-medium ${!type.ativo ? 'text-muted-foreground line-through' : ''}`}>
                          {type.nome}
                        </span>
                        {type.descricao && (
                          <p className="text-sm text-muted-foreground">
                            {type.descricao}
                          </p>
                        )}
                      </div>
                      <Badge variant={type.ativo ? 'default' : 'secondary'}>
                        {type.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Badge variant="outline">#{type.ordem}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={type.ativo}
                        onCheckedChange={() => handleToggleStatus(type)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(type)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo' : 'Novo Tipo de Uso'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Contínuo"
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional"
                  rows={2}
                />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded border-2 ${formData.cor === color ? 'border-foreground' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, cor: color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingType ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
