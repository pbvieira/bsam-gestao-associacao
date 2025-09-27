import { useState, useEffect } from 'react';
import { useInventory } from '@/hooks/use-inventory';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown,
  Package,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const movementSchema = z.object({
  inventory_item_id: z.string().min(1, 'Item é obrigatório'),
  tipo_movimento: z.enum(['entrada', 'saida']),
  quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
  valor_unitario: z.number().min(0).optional(),
  origem_movimento: z.enum(['compra', 'doacao', 'consumo', 'perda', 'ajuste']),
  data_movimento: z.string().min(1, 'Data é obrigatória'),
  observacoes: z.string().optional(),
});

type MovementForm = z.infer<typeof movementSchema>;

interface InventoryMovementsProps {
  itemId?: string;
}

export function InventoryMovements({ itemId }: InventoryMovementsProps) {
  const { items, movements, fetchMovements, createMovement } = useInventory();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      inventory_item_id: itemId || '',
      tipo_movimento: 'entrada',
      quantidade: 1,
      origem_movimento: 'compra',
      data_movimento: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    if (itemId) {
      fetchMovements(itemId);
      form.setValue('inventory_item_id', itemId);
    } else {
      fetchMovements();
    }
  }, [itemId]);

  const onSubmit = async (data: MovementForm) => {
    setLoading(true);
    try {
      const result = await createMovement({
        inventory_item_id: data.inventory_item_id,
        tipo_movimento: data.tipo_movimento,
        quantidade: data.quantidade,
        valor_unitario: data.valor_unitario,
        origem_movimento: data.origem_movimento,
        data_movimento: data.data_movimento,
        observacoes: data.observacoes,
      });
      
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada com sucesso!',
      });

      setDialogOpen(false);
      form.reset({
        inventory_item_id: itemId || '',
        tipo_movimento: 'entrada',
        quantidade: 1,
        origem_movimento: 'compra',
        data_movimento: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (tipo: string) => {
    return tipo === 'entrada' ? (
      <ArrowUp className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-600" />
    );
  };

  const getOrigemLabel = (origem: string) => {
    const labels = {
      compra: 'Compra',
      doacao: 'Doação',
      consumo: 'Consumo',
      perda: 'Perda',
      ajuste: 'Ajuste'
    };
    return labels[origem as keyof typeof labels] || origem;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {itemId ? 'Movimentações do Item' : 'Movimentações Recentes'}
            </CardTitle>
            <CardDescription>
              Histórico de entradas e saídas do estoque
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Movimentação</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {!itemId && (
                    <FormField
                      control={form.control}
                      name="inventory_item_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o item" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {items.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tipo_movimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="entrada">Entrada</SelectItem>
                              <SelectItem value="saida">Saída</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="origem_movimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Origem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="compra">Compra</SelectItem>
                            <SelectItem value="doacao">Doação</SelectItem>
                            <SelectItem value="consumo">Consumo</SelectItem>
                            <SelectItem value="perda">Perda</SelectItem>
                            <SelectItem value="ajuste">Ajuste</SelectItem>
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
                      name="valor_unitario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unit. (R$)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                              value={field.value || ''}
                            />
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
                          <Textarea placeholder="Observações..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      Registrar
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {movements.length > 0 ? (
          movements.map((movement) => {
            const item = items.find(i => i.id === movement.inventory_item_id);
            return (
              <Card key={movement.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMovementIcon(movement.tipo_movimento)}
                      <div>
                        <p className="font-medium">
                          {item?.nome || 'Item não encontrado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'} • 
                          {getOrigemLabel(movement.origem_movimento)} • 
                          {format(new Date(movement.data_movimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-medium ${
                        movement.tipo_movimento === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.tipo_movimento === 'entrada' ? '+' : '-'}{movement.quantidade}
                        {item?.unidade_medida && <span className="text-xs ml-1">{item.unidade_medida}</span>}
                      </p>
                      {movement.valor_unitario && (
                        <p className="text-sm text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(movement.valor_unitario)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {movement.observacoes && (
                    <p className="text-sm text-muted-foreground mt-2 pl-7">
                      {movement.observacoes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma movimentação encontrada</h3>
              <p className="text-muted-foreground">
                {itemId 
                  ? 'Este item ainda não possui movimentações.' 
                  : 'Nenhuma movimentação registrada no sistema.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}