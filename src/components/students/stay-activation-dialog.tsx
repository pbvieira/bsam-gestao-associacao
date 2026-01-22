import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOTIVOS_SAIDA } from '@/hooks/use-student-stays';
import { Loader2, UserCheck } from 'lucide-react';

const activationSchema = z.object({
  motivo_saida: z.string().min(1, 'Selecione o motivo da saída anterior'),
  observacoes: z.string().optional(),
  nova_data_entrada: z.string().min(1, 'Data de entrada é obrigatória'),
  nova_hora_entrada: z.string().optional(),
});

type ActivationFormData = z.infer<typeof activationSchema>;

interface StayActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  dataSaidaAnterior: string | null;
  onConfirm: (data: ActivationFormData) => Promise<void>;
}

export function StayActivationDialog({
  open,
  onOpenChange,
  studentName,
  dataSaidaAnterior,
  onConfirm,
}: StayActivationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ActivationFormData>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      motivo_saida: '',
      observacoes: '',
      nova_data_entrada: new Date().toISOString().split('T')[0],
      nova_hora_entrada: '',
    },
  });

  const handleSubmit = async (data: ActivationFormData) => {
    setIsSubmitting(true);
    try {
      await onConfirm(data);
      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Reativar Aluno
          </DialogTitle>
          <DialogDescription>
            Você está reativando <strong>{studentName}</strong>.
            {dataSaidaAnterior && (
              <>
                <br />
                A estadia anterior será arquivada no histórico.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="motivo_saida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Saída Anterior *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOTIVOS_SAIDA.map((motivo) => (
                        <SelectItem key={motivo.value} value={motivo.value}>
                          {motivo.label}
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações sobre a saída anterior</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informações adicionais sobre a saída..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nova_data_entrada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Data de Entrada *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nova_hora_entrada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Entrada</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ENTRE - 00H00 ÀS 12H00">00H00 às 12H00</SelectItem>
                        <SelectItem value="ENTRE - 12H01 ÀS 18H00">12H01 às 18H00</SelectItem>
                        <SelectItem value="ENTRE - 18H01 ÀS 00H00">18H01 às 00H00</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Confirmar Reativação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
