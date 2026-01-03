import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  StudentHospitalization, 
  HospitalizationInput,
  HOSPITALIZATION_TYPES 
} from '@/hooks/use-student-hospitalizations';

const hospitalizationSchema = z.object({
  data_entrada: z.date({ required_error: 'Data de entrada é obrigatória' }),
  data_saida: z.date().nullable().optional(),
  ainda_internado: z.boolean().default(false),
  tipo_internacao: z.string().min(1, 'Tipo é obrigatório'),
  local: z.string().optional(),
  motivo: z.string().min(1, 'Motivo é obrigatório'),
  diagnostico: z.string().optional(),
  medico_responsavel: z.string().optional(),
  observacoes: z.string().optional(),
});

type HospitalizationFormData = z.infer<typeof hospitalizationSchema>;

interface HospitalizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hospitalization?: StudentHospitalization | null;
  onSave: (data: HospitalizationInput) => Promise<{ error: string | null }>;
  onUpdate?: (id: string, data: Partial<HospitalizationInput>) => Promise<{ error: string | null }>;
}

export function HospitalizationDialog({
  open,
  onOpenChange,
  hospitalization,
  onSave,
  onUpdate,
}: HospitalizationDialogProps) {
  const isEditing = !!hospitalization;

  const form = useForm<HospitalizationFormData>({
    resolver: zodResolver(hospitalizationSchema),
    defaultValues: {
      data_entrada: new Date(),
      data_saida: null,
      ainda_internado: false,
      tipo_internacao: '',
      local: '',
      motivo: '',
      diagnostico: '',
      medico_responsavel: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    if (hospitalization) {
      form.reset({
        data_entrada: new Date(hospitalization.data_entrada),
        data_saida: hospitalization.data_saida ? new Date(hospitalization.data_saida) : null,
        ainda_internado: !hospitalization.data_saida,
        tipo_internacao: hospitalization.tipo_internacao,
        local: hospitalization.local || '',
        motivo: hospitalization.motivo,
        diagnostico: hospitalization.diagnostico || '',
        medico_responsavel: hospitalization.medico_responsavel || '',
        observacoes: hospitalization.observacoes || '',
      });
    } else {
      form.reset({
        data_entrada: new Date(),
        data_saida: null,
        ainda_internado: false,
        tipo_internacao: '',
        local: '',
        motivo: '',
        diagnostico: '',
        medico_responsavel: '',
        observacoes: '',
      });
    }
  }, [hospitalization, form]);

  const aindaInternado = form.watch('ainda_internado');

  const onSubmit = async (data: HospitalizationFormData) => {
    const payload: HospitalizationInput = {
      student_id: hospitalization?.student_id || '',
      data_entrada: format(data.data_entrada, 'yyyy-MM-dd'),
      data_saida: data.ainda_internado ? null : (data.data_saida ? format(data.data_saida, 'yyyy-MM-dd') : null),
      tipo_internacao: data.tipo_internacao,
      local: data.local || null,
      motivo: data.motivo,
      diagnostico: data.diagnostico || null,
      medico_responsavel: data.medico_responsavel || null,
      observacoes: data.observacoes || null,
    };

    let result;
    if (isEditing && onUpdate && hospitalization) {
      result = await onUpdate(hospitalization.id, payload);
    } else {
      result = await onSave(payload);
    }

    if (!result.error) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Internação' : 'Nova Internação'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_entrada"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Entrada *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="ainda_internado"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-6">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ainda internado</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {!aindaInternado && (
              <FormField
                control={form.control}
                name="data_saida"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Saída</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="tipo_internacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Internação *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HOSPITALIZATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local (Hospital/Clínica)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do hospital ou clínica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Internação *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o motivo da internação" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnostico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Diagnóstico médico" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="medico_responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médico Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do médico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
