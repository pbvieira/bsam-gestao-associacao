import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus } from 'lucide-react';
import { StudentAnnotation } from '@/hooks/use-student-annotations';

const annotationSchema = z.object({
  tipo: z.enum(['anotacao', 'gasto']),
  categoria: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.string().optional(),
  data_evento: z.string().min(1, 'Data do evento é obrigatória'),
  data_agendamento: z.string().optional(),
  observacoes: z.string().optional(),
});

type AnnotationForm = z.infer<typeof annotationSchema>;

interface AnnotationDialogProps {
  annotation?: StudentAnnotation;
  onSave: (data: {
    tipo: string;
    categoria?: string | null;
    descricao: string;
    valor?: number | null;
    data_evento: string;
    data_agendamento?: string | null;
    observacoes?: string | null;
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

export function AnnotationDialog({ annotation, onSave, trigger }: AnnotationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('anotacao');
  const { toast } = useToast();

  const form = useForm<AnnotationForm>({
    resolver: zodResolver(annotationSchema),
    defaultValues: {
      tipo: 'anotacao',
      categoria: annotation?.categoria || '',
      descricao: annotation?.descricao || '',
      valor: annotation?.valor?.toString() || '',
      data_evento: annotation?.data_evento || new Date().toISOString().split('T')[0],
      data_agendamento: annotation?.data_agendamento || '',
      observacoes: annotation?.observacoes || '',
    },
  });

  const onSubmit = async (data: AnnotationForm) => {
    setIsSaving(true);
    try {
      await onSave({
        tipo: activeTab,
        categoria: activeTab === 'anotacao' ? data.categoria || null : null,
        descricao: data.descricao,
        valor: activeTab === 'gasto' && data.valor ? parseFloat(data.valor) : null,
        data_evento: data.data_evento,
        data_agendamento: data.data_agendamento || null,
        observacoes: data.observacoes || null,
      });
      toast({
        title: 'Sucesso',
        description: `${activeTab === 'anotacao' ? 'Anotação' : 'Gasto'} ${annotation ? 'atualizado' : 'adicionado'} com sucesso!`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Anotação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {annotation ? 'Editar Registro' : 'Novo Registro'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="anotacao">Anotação</TabsTrigger>
            <TabsTrigger value="gasto">Gasto</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="anotacao" className="space-y-4">
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="atendimento">Atendimento</SelectItem>
                          <SelectItem value="curso">Curso</SelectItem>
                          <SelectItem value="entrega_item">Entrega de Item</SelectItem>
                          <SelectItem value="compra">Compra</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o que aconteceu..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="data_evento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Evento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_agendamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Agendamento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observações adicionais..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="gasto" className="space-y-4">
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Despesa *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o gasto realizado..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor (R$) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_evento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Gasto *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Detalhes sobre o gasto..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  {annotation ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}