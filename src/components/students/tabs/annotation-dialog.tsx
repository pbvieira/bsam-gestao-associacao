import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAnnotationCategories } from '@/hooks/use-annotation-categories';
import { Loader2, Save, Plus } from 'lucide-react';
import { StudentAnnotation } from '@/hooks/use-student-annotations';

const annotationSchema = z.object({
  categoria: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  data_evento: z.string().min(1, 'Data do evento é obrigatória'),
});

type AnnotationForm = z.infer<typeof annotationSchema>;

interface AnnotationDialogProps {
  annotation?: StudentAnnotation;
  onSave: (data: {
    tipo: string;
    categoria?: string | null;
    descricao: string;
    data_evento: string;
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

export function AnnotationDialog({ annotation, onSave, trigger }: AnnotationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { categories, loading: categoriesLoading } = useAnnotationCategories();
  const { toast } = useToast();

  const form = useForm<AnnotationForm>({
    resolver: zodResolver(annotationSchema),
    defaultValues: {
      categoria: annotation?.categoria || '',
      descricao: annotation?.descricao || '',
      data_evento: annotation?.data_evento || new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: AnnotationForm) => {
    setIsSaving(true);
    try {
      await onSave({
        tipo: 'anotacao',
        categoria: data.categoria || null,
        descricao: data.descricao,
        data_evento: data.data_evento,
      });
      toast({
        title: 'Sucesso',
        description: `Anotação ${annotation ? 'atualizada' : 'adicionada'} com sucesso!`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar a anotação.',
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {annotation ? 'Editar Anotação' : 'Nova Anotação'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={categoriesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.nome}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.cor }}
                            />
                            {category.nome}
                          </div>
                        </SelectItem>
                      ))}
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
      </DialogContent>
    </Dialog>
  );
}