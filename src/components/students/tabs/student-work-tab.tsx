import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudentFormContext } from '@/contexts/StudentFormContext';
import { Loader2 } from 'lucide-react';

interface StudentWorkTabProps {
  studentId?: string | null;
}

export function StudentWorkTab({ studentId }: StudentWorkTabProps) {
  const { workForm: form, isLoading } = useStudentFormContext();

  if (isLoading) {
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
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Profissão e Emprego</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="profissao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl><Input placeholder="Ex: Técnico, Vendedor" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="situacao_trabalhista" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação Trabalhista</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
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
                )} />
                <FormField control={form.control} name="empresa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl><Input placeholder="Nome da empresa" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="funcao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl><Input placeholder="Função exercida" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="data_admissao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Admissão</FormLabel>
                    <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contato_empresa" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato da Empresa</FormLabel>
                    <FormControl><Input placeholder="Telefone/e-mail da empresa" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Renda</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="tipo_renda" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Renda</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
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
                )} />
                <FormField control={form.control} name="valor_renda" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Renda (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="renda_per_capita" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Renda Per Capita (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
