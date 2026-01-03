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
  StudentMedicalRecord, 
  MedicalRecordInput,
  MEDICAL_RECORD_TYPES 
} from '@/hooks/use-student-medical-records';

const medicalRecordSchema = z.object({
  data_atendimento: z.date({ required_error: 'Data do atendimento é obrigatória' }),
  tipo_atendimento: z.string().min(1, 'Tipo é obrigatório'),
  especialidade: z.string().optional(),
  profissional: z.string().optional(),
  local: z.string().optional(),
  motivo: z.string().optional(),
  diagnostico: z.string().optional(),
  prescricao: z.string().optional(),
  observacoes: z.string().optional(),
  data_retorno: z.date().nullable().optional(),
});

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

interface MedicalRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicalRecord?: StudentMedicalRecord | null;
  onSave: (data: MedicalRecordInput) => Promise<{ error: string | null }>;
  onUpdate?: (id: string, data: Partial<MedicalRecordInput>) => Promise<{ error: string | null }>;
}

export function MedicalRecordDialog({
  open,
  onOpenChange,
  medicalRecord,
  onSave,
  onUpdate,
}: MedicalRecordDialogProps) {
  const isEditing = !!medicalRecord;

  const form = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      data_atendimento: new Date(),
      tipo_atendimento: '',
      especialidade: '',
      profissional: '',
      local: '',
      motivo: '',
      diagnostico: '',
      prescricao: '',
      observacoes: '',
      data_retorno: null,
    },
  });

  useEffect(() => {
    if (medicalRecord) {
      form.reset({
        data_atendimento: new Date(medicalRecord.data_atendimento),
        tipo_atendimento: medicalRecord.tipo_atendimento,
        especialidade: medicalRecord.especialidade || '',
        profissional: medicalRecord.profissional || '',
        local: medicalRecord.local || '',
        motivo: medicalRecord.motivo || '',
        diagnostico: medicalRecord.diagnostico || '',
        prescricao: medicalRecord.prescricao || '',
        observacoes: medicalRecord.observacoes || '',
        data_retorno: medicalRecord.data_retorno ? new Date(medicalRecord.data_retorno) : null,
      });
    } else {
      form.reset({
        data_atendimento: new Date(),
        tipo_atendimento: '',
        especialidade: '',
        profissional: '',
        local: '',
        motivo: '',
        diagnostico: '',
        prescricao: '',
        observacoes: '',
        data_retorno: null,
      });
    }
  }, [medicalRecord, form]);

  const onSubmit = async (data: MedicalRecordFormData) => {
    const payload: MedicalRecordInput = {
      student_id: medicalRecord?.student_id || '',
      data_atendimento: format(data.data_atendimento, 'yyyy-MM-dd'),
      tipo_atendimento: data.tipo_atendimento,
      especialidade: data.especialidade || null,
      profissional: data.profissional || null,
      local: data.local || null,
      motivo: data.motivo || null,
      diagnostico: data.diagnostico || null,
      prescricao: data.prescricao || null,
      observacoes: data.observacoes || null,
      data_retorno: data.data_retorno ? format(data.data_retorno, 'yyyy-MM-dd') : null,
    };

    let result;
    if (isEditing && onUpdate && medicalRecord) {
      result = await onUpdate(medicalRecord.id, payload);
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
            {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_atendimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Atendimento *</FormLabel>
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

              <FormField
                control={form.control}
                name="tipo_atendimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Atendimento *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MEDICAL_RECORD_TYPES.map((type) => (
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="especialidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cardiologia, Ortopedia..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profissional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissional</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do profissional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Hospital, clínica, consultório..." {...field} />
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
                  <FormLabel>Motivo/Queixa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o motivo do atendimento" 
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
                      placeholder="Diagnóstico ou conclusão" 
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
              name="prescricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescrição/Recomendações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Medicamentos, tratamentos, recomendações..." 
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
              name="data_retorno"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Retorno</FormLabel>
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
                            <span>Selecione a data (opcional)</span>
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
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
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
