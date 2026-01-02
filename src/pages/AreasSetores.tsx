import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { useAreas, Area, AreaFormData } from '@/hooks/use-areas';
import { useSetores, Setor, SetorFormData } from '@/hooks/use-setores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
} from 'lucide-react';

export default function AreasSetores() {
  const { areas, isLoading: areasLoading, createArea, updateArea, deleteArea, toggleAreaStatus } = useAreas();
  const { setores, isLoading: setoresLoading, createSetor, updateSetor, deleteSetor, toggleSetorStatus } = useSetores();

  // State for dialogs
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [setorDialogOpen, setSetorDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for editing
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editingSetor, setEditingSetor] = useState<Setor | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'area' | 'setor'; id: string; nome: string } | null>(null);

  // State for expanded areas
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());

  // Form states
  const [areaForm, setAreaForm] = useState<AreaFormData>({ nome: '', descricao: '', cor: '#6366f1' });
  const [setorForm, setSetorForm] = useState<SetorFormData>({ area_id: '', nome: '', descricao: '' });

  const toggleExpanded = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const getSetoresByArea = (areaId: string) => {
    return setores.filter((s) => s.area_id === areaId);
  };

  // Area handlers
  const openAreaDialog = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setAreaForm({
        nome: area.nome,
        descricao: area.descricao || '',
        cor: area.cor,
      });
    } else {
      setEditingArea(null);
      setAreaForm({ nome: '', descricao: '', cor: '#6366f1' });
    }
    setAreaDialogOpen(true);
  };

  const handleAreaSubmit = async () => {
    if (!areaForm.nome.trim()) return;

    if (editingArea) {
      await updateArea.mutateAsync({ id: editingArea.id, ...areaForm });
    } else {
      await createArea.mutateAsync(areaForm);
    }
    setAreaDialogOpen(false);
  };

  // Setor handlers
  const openSetorDialog = (areaId: string, setor?: Setor) => {
    setSelectedAreaId(areaId);
    if (setor) {
      setEditingSetor(setor);
      setSetorForm({
        area_id: setor.area_id,
        nome: setor.nome,
        descricao: setor.descricao || '',
      });
    } else {
      setEditingSetor(null);
      setSetorForm({ area_id: areaId, nome: '', descricao: '' });
    }
    setSetorDialogOpen(true);
  };

  const handleSetorSubmit = async () => {
    if (!setorForm.nome.trim() || !setorForm.area_id) return;

    if (editingSetor) {
      await updateSetor.mutateAsync({ id: editingSetor.id, ...setorForm });
    } else {
      await createSetor.mutateAsync(setorForm);
    }
    setSetorDialogOpen(false);
  };

  // Delete handlers
  const openDeleteDialog = (type: 'area' | 'setor', id: string, nome: string) => {
    setDeleteTarget({ type, id, nome });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'area') {
      await deleteArea.mutateAsync(deleteTarget.id);
    } else {
      await deleteSetor.mutateAsync(deleteTarget.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  if (areasLoading || setoresLoading) {
    return (
      <MainLayout>
        <PageLayout title="Áreas e Setores" subtitle="Carregando...">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </PageLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
    <PageLayout
      title="Áreas e Setores"
      subtitle="Gerencie as áreas e setores da instituição"
      actionButton={
        <Button onClick={() => openAreaDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Área
        </Button>
      }
    >
      <div className="space-y-4">
        {areas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhuma área cadastrada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Área" para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          areas.map((area) => {
            const areaSetores = getSetoresByArea(area.id);
            const isExpanded = expandedAreas.has(area.id);

            return (
              <Card key={area.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(area.id)}>
                  <div className="flex items-center justify-between p-4 bg-muted/30">
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: area.cor }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{area.nome}</span>
                            <Badge variant={area.ativo ? 'default' : 'secondary'}>
                              {area.ativo ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {areaSetores.length} {areaSetores.length === 1 ? 'setor' : 'setores'}
                            </Badge>
                          </div>
                          {area.descricao && (
                            <p className="text-sm text-muted-foreground mt-0.5">{area.descricao}</p>
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={area.ativo}
                        onCheckedChange={(checked) =>
                          toggleAreaStatus.mutate({ id: area.id, ativo: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openAreaDialog(area)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog('area', area.id, area.nome)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <CollapsibleContent>
                    <div className="border-t">
                      {areaSetores.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum setor cadastrado nesta área</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {areaSetores.map((setor) => (
                            <div
                              key={setor.id}
                              className="flex items-center justify-between px-4 py-3 pl-12 hover:bg-muted/20"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{setor.nome}</span>
                                  <Badge
                                    variant={setor.ativo ? 'outline' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {setor.ativo ? 'Ativo' : 'Inativo'}
                                  </Badge>
                                </div>
                                {setor.descricao && (
                                  <p className="text-sm text-muted-foreground">{setor.descricao}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={setor.ativo}
                                  onCheckedChange={(checked) =>
                                    toggleSetorStatus.mutate({ id: setor.id, ativo: checked })
                                  }
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openSetorDialog(area.id, setor)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog('setor', setor.id, setor.nome)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="p-3 border-t bg-muted/10">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSetorDialog(area.id)}
                          className="w-full"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Setor
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>

      {/* Area Dialog */}
      <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Editar Área' : 'Nova Área'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="area-nome">Nome *</Label>
              <Input
                id="area-nome"
                value={areaForm.nome}
                onChange={(e) => setAreaForm({ ...areaForm, nome: e.target.value })}
                placeholder="Nome da área"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-descricao">Descrição</Label>
              <Textarea
                id="area-descricao"
                value={areaForm.descricao}
                onChange={(e) => setAreaForm({ ...areaForm, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area-cor">Cor</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="area-cor"
                  type="color"
                  value={areaForm.cor}
                  onChange={(e) => setAreaForm({ ...areaForm, cor: e.target.value })}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={areaForm.cor}
                  onChange={(e) => setAreaForm({ ...areaForm, cor: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAreaSubmit}
              disabled={!areaForm.nome.trim() || createArea.isPending || updateArea.isPending}
            >
              {editingArea ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setor Dialog */}
      <Dialog open={setorDialogOpen} onOpenChange={setSetorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSetor ? 'Editar Setor' : 'Novo Setor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="setor-nome">Nome *</Label>
              <Input
                id="setor-nome"
                value={setorForm.nome}
                onChange={(e) => setSetorForm({ ...setorForm, nome: e.target.value })}
                placeholder="Nome do setor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setor-descricao">Descrição</Label>
              <Textarea
                id="setor-descricao"
                value={setorForm.descricao}
                onChange={(e) => setSetorForm({ ...setorForm, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetorDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSetorSubmit}
              disabled={!setorForm.nome.trim() || createSetor.isPending || updateSetor.isPending}
            >
              {editingSetor ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'area' ? (
                <>
                  Tem certeza que deseja excluir a área <strong>"{deleteTarget?.nome}"</strong>?
                  <br />
                  <span className="text-destructive font-medium">
                    Todos os setores desta área também serão excluídos.
                  </span>
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir o setor <strong>"{deleteTarget?.nome}"</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
    </MainLayout>
  );
}
