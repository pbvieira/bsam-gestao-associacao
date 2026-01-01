import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudentFormContext } from '@/contexts/StudentFormContext';
import { Loader2, Heart, Brain, Pill, Users } from 'lucide-react';

interface StudentHealthTabProps {
  studentId?: string | null;
}

export function StudentHealthTab({ studentId }: StudentHealthTabProps) {
  const { healthForm: form, isLoading } = useStudentFormContext();

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
    <div className="space-y-6">
      <Form {...form}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" />Histórico Médico</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="teste_covid" render={({ field }) => (
                  <FormItem><FormLabel>Teste COVID-19</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem><SelectItem value="nao_informado">Não informado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="resultado_covid" render={({ field }) => (
                  <FormItem><FormLabel>Resultado COVID-19</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="positivo">Positivo</SelectItem><SelectItem value="negativo">Negativo</SelectItem><SelectItem value="inconclusivo">Inconclusivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="data_teste_covid" render={({ field }) => (<FormItem><FormLabel>Data do Teste COVID</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="teste_ist" render={({ field }) => (
                  <FormItem><FormLabel>Teste IST</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="sim">Sim</SelectItem><SelectItem value="nao">Não</SelectItem><SelectItem value="nao_informado">Não informado</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="resultado_ist" render={({ field }) => (
                  <FormItem><FormLabel>Resultado IST</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="positivo">Positivo</SelectItem><SelectItem value="negativo">Negativo</SelectItem><SelectItem value="inconclusivo">Inconclusivo</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="data_teste_ist" render={({ field }) => (<FormItem><FormLabel>Data do Teste IST</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField control={form.control} name="tem_deficiencia" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Possui deficiência</FormLabel></div></FormItem>)} />
                  {form.watch('tem_deficiencia') && <FormField control={form.control} name="tipo_deficiencia" render={({ field }) => (<FormItem><FormLabel>Tipo de Deficiência</FormLabel><FormControl><Input placeholder="Descreva o tipo de deficiência" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />}
                </div>
                <div className="space-y-4">
                  <FormField control={form.control} name="vacinacao_atualizada" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Vacinação atualizada</FormLabel></div></FormItem>)} />
                  <FormField control={form.control} name="tratamento_odontologico" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Em tratamento odontológico</FormLabel></div></FormItem>)} />
                  {form.watch('tratamento_odontologico') && <FormField control={form.control} name="observacoes_odontologicas" render={({ field }) => (<FormItem><FormLabel>Observações Odontológicas</FormLabel><FormControl><Textarea placeholder="Detalhes do tratamento..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Saúde Mental</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="historico_internacoes" render={({ field }) => (<FormItem><FormLabel>Histórico de Internações</FormLabel><FormControl><Textarea placeholder="Descreva histórico de internações psiquiátricas..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField control={form.control} name="acompanhamento_psicologico" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Acompanhamento psicológico</FormLabel></div></FormItem>)} />
                  {form.watch('acompanhamento_psicologico') && <FormField control={form.control} name="detalhes_acompanhamento" render={({ field }) => (<FormItem><FormLabel>Detalhes do Acompanhamento</FormLabel><FormControl><Textarea placeholder="Detalhes..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />}
                </div>
                <div className="space-y-4">
                  <FormField control={form.control} name="tentativa_suicidio" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Tentativa de suicídio</FormLabel></div></FormItem>)} />
                  <FormField control={form.control} name="historico_surtos" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Histórico de surtos</FormLabel></div></FormItem>)} />
                  <FormField control={form.control} name="alucinacoes" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Alucinações</FormLabel></div></FormItem>)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5" />Medicamentos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="uso_medicamentos" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Faz uso de medicamentos</FormLabel></div></FormItem>)} />
              {form.watch('uso_medicamentos') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="descricao_medicamentos" render={({ field }) => (<FormItem><FormLabel>Quais medicamentos</FormLabel><FormControl><Input placeholder="Liste os medicamentos" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="tempo_uso_medicamentos" render={({ field }) => (<FormItem><FormLabel>Tempo de uso</FormLabel><FormControl><Input placeholder="Ex: 2 anos" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="modo_uso_medicamentos" render={({ field }) => (<FormItem><FormLabel>Modo de uso</FormLabel><FormControl><Input placeholder="Ex: 2x ao dia" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Histórico Familiar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="dependencia_quimica_familia" render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><div className="leading-none"><FormLabel>Dependência química na família</FormLabel></div></FormItem>)} />
              {form.watch('dependencia_quimica_familia') && <FormField control={form.control} name="detalhes_dependencia_familia" render={({ field }) => (<FormItem><FormLabel>Detalhes da Dependência Familiar</FormLabel><FormControl><Textarea placeholder="Descreva o caso na família..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />}
              <FormField control={form.control} name="observacoes_gerais" render={({ field }) => (<FormItem><FormLabel>Observações Gerais</FormLabel><FormControl><Textarea placeholder="Outras informações relevantes sobre a saúde..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>)} />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}
