import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { 
  ENTRADA_CATEGORIES, 
  SAIDA_CATEGORIES,
  type CashBookTransaction 
} from '@/hooks/use-student-cash-book';

const transactionSchema = z.object({
  tipo_movimento: z.enum(['entrada', 'saida']),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  data_movimento: z.string().min(1, 'Data é obrigatória'),
  valor: z.coerce.number().positive('Valor deve ser maior que zero'),
  descricao: z.string().nullish(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface CashBookTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: CashBookTransaction | null;
  onSave: (data: TransactionFormData) => Promise<{ error: string | null }>;
}

export function CashBookTransactionDialog({
  open,
  onOpenChange,
  transaction,
  onSave,
}: CashBookTransactionDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      tipo_movimento: 'entrada',
      categoria: '',
      data_movimento: new Date().toISOString().split('T')[0],
      valor: 0,
      descricao: '',
    },
  });

  const tipoMovimento = form.watch('tipo_movimento');
  const categories = tipoMovimento === 'entrada' ? ENTRADA_CATEGORIES : SAIDA_CATEGORIES;

  useEffect(() => {
    if (open) {
      if (transaction) {
        form.reset({
          tipo_movimento: transaction.tipo_movimento,
          categoria: transaction.categoria,
          data_movimento: transaction.data_movimento,
          valor: transaction.valor,
          descricao: transaction.descricao || '',
        });
      } else {
        form.reset({
          tipo_movimento: 'entrada',
          categoria: '',
          data_movimento: new Date().toISOString().split('T')[0],
          valor: 0,
          descricao: '',
        });
      }
    }
  }, [open, transaction, form]);

  // Reset categoria when tipo_movimento changes
  useEffect(() => {
    if (!transaction) {
      form.setValue('categoria', '');
    }
  }, [tipoMovimento, transaction, form]);

  const handleSubmit = async (data: TransactionFormData) => {
    setIsSaving(true);
    try {
      const result = await onSave(data);
      if (!result.error) {
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_movimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimento *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entrada" id="entrada" />
                        <Label htmlFor="entrada" className="text-green-600 font-medium cursor-pointer">
                          Entrada
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="saida" id="saida" />
                        <Label htmlFor="saida" className="text-red-600 font-medium cursor-pointer">
                          Saída
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_movimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        min="0.01"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da transação (opcional)"
                      className="resize-none"
                      rows={2}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
