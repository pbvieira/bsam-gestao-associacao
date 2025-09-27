import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudentWorkSituation } from '@/hooks/use-student-work-situation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

const workSituationSchema = z.object({
  situacao_trabalhista: z.string().optional(),
  profissao: z.string().optional(),
  empresa: z.string().optional(),
  funcao: z.string().optional(),
  data_admissao: z.string().optional(),
  contato_empresa: z.string().optional(),
  tipo_renda: z.string().optional(),
  valor_renda: z.string().optional(),
  renda_per_capita: z.string().optional(),
});

type WorkSituationForm = z.infer<typeof workSituationSchema>;

interface StudentWorkTabProps {
  studentId?: string;
}

export function StudentWorkTab({ studentId }: StudentWorkTabProps) {
  const { workSituation, loading, createOrUpdateWorkSituation } = useStudentWorkSituation(studentId);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<WorkSituationForm>({
    resolver: zodResolver(workSituationSchema),
    defaultValues: {
      situacao_trabalhista: '',
      profissao: '',
      empresa: '',
      funcao: '',
      data_admissao: '',
      contato_empresa: '',
      tipo_renda: '',
      valor_renda: '',
      renda_per_capita: '',
    },
  });

  useEffect(() => {
    if (workSituation) {
      form.reset({
        situacao_trabalhista: workSituation.situacao_trabalhista || '',
        profissao: workSituation.profissao || '',
        empresa: workSituation.empresa || '',
        funcao: workSituation.funcao || '',
        data_admissao: workSituation.data_admissao || '',
        contato_empresa: workSituation.contato_empresa || '',
        tipo_renda: workSituation.tipo_renda || '',
        valor_renda: workSituation.valor_renda?.toString() || '',
        renda_per_capita: workSituation.renda_per_capita?.toString() || '',
      });
    }
  }, [workSituation, form]);

  const onSubmit = async (data: WorkSituationForm) => {
    if (!studentId) {
      toast({
        title: 'Erro',
        description: 'Salve o aluno primeiro para adicionar dados de trabalho',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await createOrUpdateWorkSituation({
        ...data,
        valor_renda: data.valor_renda ? parseFloat(data.valor_renda) : null,
        renda_per_capita: data.renda_per_capita ? parseFloat(data.renda_per_capita) : null,
      });

      if (result?.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: 'Situação trabalhista salva com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Situação Trabalhista</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção: Profissão e Emprego */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Profissão e Emprego</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="profissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profissão</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Técnico, Vendedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="situacao_trabalhista"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação Trabalhista</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="empregado">Empregado</SelectItem>
                          <SelectItem value="desempregado">Desempregado</SelectItem>
                          <SelectItem value="autonomo">Autônomo</SelectItem>
                          <SelectItem value="aposentado">Aposentado</SelectItem>
                          <SelectItem value="estudante">Estudante</SelectItem>
                          <SelectItem value="beneficio">Recebe Benefício</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="funcao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Função exercida" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_admissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Admissão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contato_empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Telefone/e-mail da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção: Renda */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Renda</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tipo_renda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Renda</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="salario">Salário</SelectItem>
                          <SelectItem value="autonomo">Renda Autônoma</SelectItem>
                          <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                          <SelectItem value="auxilio">Auxílio/Benefício</SelectItem>
                          <SelectItem value="pensao">Pensão</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_renda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Renda (R$)</FormLabel>
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
                  name="renda_per_capita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Renda Per Capita (R$)</FormLabel>
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
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}