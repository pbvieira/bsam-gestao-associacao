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
import { useFiliationStatus, type FiliationStatus } from '@/hooks/use-filiation-status';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit, Trash2, Users } from 'lucide-react';

const statusSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal (#RRGGBB)'),
  ordem: z.number().min(0, 'Ordem deve ser um número positivo'),
  ativo: z.boolean().default(true),
});

type StatusForm = z.infer<typeof statusSchema>;

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

function StatusDialog({ status, onSave }: { status?: FiliationStatus; onSave: (data: StatusForm) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      cor: '#6366f1',
      ordem: 0,
      ativo: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        nome: status?.nome || '',
        descricao: status?.descricao || '',
        cor: status?.cor || '#6366f1',
        ordem: status?.ordem || 0,
        ativo: status?.ativo !== false,
      });
    }
  }, [open, status, form]);

  const onSubmit = async (data: StatusForm) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast({
        title: 'Sucesso',
        description: `Status ${status ? 'atualizado' : 'criado'} com sucesso!`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o status.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {status ? (
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {status ? 'Editar Status' : 'Novo Status'}
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
                    <Input placeholder="Nome do status..." {...field} />
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
                    <Textarea placeholder="Descrição do status..." {...field} />
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
                    <FormLabel>Status Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Desative para ocultar o status dos formulários
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
                {status ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FiliationStatusPage() {
  const { fetchAllStatuses, createStatus, updateStatus, deleteStatus, toggleStatusActive } = useFiliationStatus();
  const [statuses, setStatuses] = useState<FiliationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStatuses = async () => {
    setLoading(true);
    const { data, error } = await fetchAllStatuses();
    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive',
      });
    } else {
      setStatuses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const handleCreateStatus = async (data: StatusForm) => {
    const result = await createStatus({
      nome: data.nome,
      descricao: data.descricao || null,
      cor: data.cor,
      ativo: data.ativo,
      ordem: data.ordem,
    });
    if (result?.error) {
      throw new Error(result.error);
    }
    await loadStatuses();
  };

  const handleUpdateStatus = async (data: StatusForm, statusId: string) => {
    const result = await updateStatus(statusId, data);
    if (result?.error) {
      throw new Error(result.error);
    }
    await loadStatuses();
  };

  const handleDeleteStatus = async (statusId: string) => {
    const result = await deleteStatus(statusId);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Status removido com sucesso!',
      });
      await loadStatuses();
    }
  };

  const handleToggleStatus = async (statusId: string, newStatus: boolean) => {
    const result = await toggleStatusActive(statusId, newStatus);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      await loadStatuses();
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando status...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estado Filiação</h1>
            <p className="text-muted-foreground">
              Gerencie os estados de filiação disponíveis para Mãe e Pai no cadastro de alunos
            </p>
          </div>
          <StatusDialog onSave={handleCreateStatus} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Status de Filiação ({statuses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statuses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum status encontrado</p>
                <p className="text-sm mb-4">Crie o primeiro status para começar</p>
                <StatusDialog onSave={handleCreateStatus} />
              </div>
            ) : (
              <div className="space-y-4">
                {statuses.map((status) => (
                  <div
                    key={status.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: status.cor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{status.nome}</h3>
                            <Badge variant={status.ativo ? 'default' : 'secondary'}>
                              {status.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Ordem: {status.ordem}
                            </Badge>
                          </div>
                          {status.descricao && (
                            <p className="text-sm text-muted-foreground">
                              {status.descricao}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={status.ativo}
                          onCheckedChange={(checked) => handleToggleStatus(status.id, checked)}
                        />
                        <StatusDialog 
                          status={status}
                          onSave={(data) => handleUpdateStatus(data, status.id)}
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover status</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover o status "{status.nome}"? 
                                Esta ação não pode ser desfeita e não será possível se houver alunos utilizando este status.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStatus(status.id)}
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
