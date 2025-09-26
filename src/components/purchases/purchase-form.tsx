import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePurchases } from "@/hooks/use-purchases";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, "Fornecedor é obrigatório"),
  data_pedido: z.string().min(1, "Data do pedido é obrigatória"),
  observacoes: z.string().optional(),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

interface PurchaseFormProps {
  order?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PurchaseForm({ order, onSuccess, onCancel }: PurchaseFormProps) {
  const { createOrder, updateOrder } = usePurchases();
  const { suppliers } = useSuppliers();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: "",
      data_pedido: new Date().toISOString().split('T')[0],
      observacoes: "",
    },
  });

  useEffect(() => {
    if (order) {
      form.reset({
        supplier_id: order.supplier_id || "",
        data_pedido: order.data_pedido || new Date().toISOString().split('T')[0],
        observacoes: order.observacoes || "",
      });
    }
  }, [order, form]);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = order
        ? await updateOrder(order.id, {
            supplier_id: data.supplier_id,
            data_pedido: data.data_pedido,
            observacoes: data.observacoes,
          })
        : await createOrder({
            supplier_id: data.supplier_id,
            data_pedido: data.data_pedido,
            observacoes: data.observacoes,
          });

      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: `Pedido ${order ? "atualizado" : "criado"} com sucesso`,
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSuppliers = suppliers.filter(supplier => supplier.ativo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{order ? "Editar Pedido" : "Novo Pedido de Compra"}</CardTitle>
        <CardDescription>
          {order 
            ? "Edite as informações do pedido de compra" 
            : "Crie um novo pedido de compra para sua organização"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o fornecedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeSuppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.razao_social}
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
                name="data_pedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Pedido *</FormLabel>
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
                    <Textarea 
                      placeholder="Informações adicionais sobre o pedido"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !activeSuppliers.length}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {order ? "Atualizar" : "Criar Pedido"}
              </Button>
            </div>

            {!activeSuppliers.length && (
              <p className="text-sm text-muted-foreground">
                Você precisa cadastrar pelo menos um fornecedor antes de criar um pedido.
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}