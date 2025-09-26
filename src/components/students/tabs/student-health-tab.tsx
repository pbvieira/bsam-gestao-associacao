import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudentHealthData } from '@/hooks/use-student-health-data';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Heart, Brain, Pill, Users } from 'lucide-react';

const healthDataSchema = z.object({
  // Testes médicos
  teste_covid: z.string().optional(),
  resultado_covid: z.string().optional(),
  data_teste_covid: z.string().optional(),
  teste_ist: z.string().optional(),
  resultado_ist: z.string().optional(),
  data_teste_ist: z.string().optional(),
  // Deficiência e tratamentos
  tem_deficiencia: z.boolean().default(false),
  tipo_deficiencia: z.string().optional(),
  vacinacao_atualizada: z.boolean().default(false),
  tratamento_odontologico: z.boolean().default(false),
  observacoes_odontologicas: z.string().optional(),
  // Saúde mental
  historico_internacoes: z.string().optional(),
  acompanhamento_psicologico: z.boolean().default(false),
  detalhes_acompanhamento: z.string().optional(),
  tentativa_suicidio: z.boolean().default(false),
  historico_surtos: z.boolean().default(false),
  alucinacoes: z.boolean().default(false),
  // Medicamentos
  uso_medicamentos: z.boolean().default(false),
  descricao_medicamentos: z.string().optional(),
  tempo_uso_medicamentos: z.string().optional(),
  modo_uso_medicamentos: z.string().optional(),
  // Histórico familiar
  dependencia_quimica_familia: z.boolean().default(false),
  detalhes_dependencia_familia: z.string().optional(),
  observacoes_gerais: z.string().optional(),
});

type HealthDataForm = z.infer<typeof healthDataSchema>;

interface StudentHealthTabProps {
  studentId?: string;
}

export function StudentHealthTab({ studentId }: StudentHealthTabProps) {
  const { healthData, loading, createOrUpdateHealthData } = useStudentHealthData(studentId);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HealthDataForm>({
    resolver: zodResolver(healthDataSchema),
    defaultValues: {
      teste_covid: '',
      resultado_covid: '',
      data_teste_covid: '',
      teste_ist: '',
      resultado_ist: '',
      data_teste_ist: '',
      tem_deficiencia: false,
      tipo_deficiencia: '',
      vacinacao_atualizada: false,
      tratamento_odontologico: false,
      observacoes_odontologicas: '',
      historico_internacoes: '',
      acompanhamento_psicologico: false,
      detalhes_acompanhamento: '',
      tentativa_suicidio: false,
      historico_surtos: false,
      alucinacoes: false,
      uso_medicamentos: false,
      descricao_medicamentos: '',
      tempo_uso_medicamentos: '',
      modo_uso_medicamentos: '',
      dependencia_quimica_familia: false,
      detalhes_dependencia_familia: '',
      observacoes_gerais: '',
    },
  });

  useEffect(() => {
    if (healthData) {
      form.reset({
        teste_covid: healthData.teste_covid || '',
        resultado_covid: healthData.resultado_covid || '',
        data_teste_covid: healthData.data_teste_covid || '',
        teste_ist: healthData.teste_ist || '',
        resultado_ist: healthData.resultado_ist || '',
        data_teste_ist: healthData.data_teste_ist || '',
        tem_deficiencia: healthData.tem_deficiencia || false,
        tipo_deficiencia: healthData.tipo_deficiencia || '',
        vacinacao_atualizada: healthData.vacinacao_atualizada || false,
        tratamento_odontologico: healthData.tratamento_odontologico || false,
        observacoes_odontologicas: healthData.observacoes_odontologicas || '',
        historico_internacoes: healthData.historico_internacoes || '',
        acompanhamento_psicologico: healthData.acompanhamento_psicologico || false,
        detalhes_acompanhamento: healthData.detalhes_acompanhamento || '',
        tentativa_suicidio: healthData.tentativa_suicidio || false,
        historico_surtos: healthData.historico_surtos || false,
        alucinacoes: healthData.alucinacoes || false,
        uso_medicamentos: healthData.uso_medicamentos || false,
        descricao_medicamentos: healthData.descricao_medicamentos || '',
        tempo_uso_medicamentos: healthData.tempo_uso_medicamentos || '',
        modo_uso_medicamentos: healthData.modo_uso_medicamentos || '',
        dependencia_quimica_familia: healthData.dependencia_quimica_familia || false,
        detalhes_dependencia_familia: healthData.detalhes_dependencia_familia || '',
        observacoes_gerais: healthData.observacoes_gerais || '',
      });
    }
  }, [healthData, form]);

  const onSubmit = async (data: HealthDataForm) => {
    if (!studentId) return;
    
    setIsSaving(true);
    try {
      const result = await createOrUpdateHealthData(data);

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
        description: 'Dados de saúde salvos com sucesso!',
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

  if (!studentId) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Selecione um aluno para gerenciar dados de saúde</p>
        </CardContent>
      </Card>
    );
  }

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
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Histórico Médico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Histórico Médico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="teste_covid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teste COVID-19</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                          <SelectItem value="nao_informado">Não informado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultado_covid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resultado COVID-19</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="positivo">Positivo</SelectItem>
                          <SelectItem value="negativo">Negativo</SelectItem>
                          <SelectItem value="inconclusivo">Inconclusivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_teste_covid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Teste COVID</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teste_ist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teste IST</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                          <SelectItem value="nao_informado">Não informado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultado_ist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resultado IST</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="positivo">Positivo</SelectItem>
                          <SelectItem value="negativo">Negativo</SelectItem>
                          <SelectItem value="inconclusivo">Inconclusivo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_teste_ist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Teste IST</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tem_deficiencia"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Possui deficiência</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch('tem_deficiencia') && (
                    <FormField
                      control={form.control}
                      name="tipo_deficiencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Deficiência</FormLabel>
                          <FormControl>
                            <Input placeholder="Descreva o tipo de deficiência" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vacinacao_atualizada"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Vacinação atualizada</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tratamento_odontologico"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Em tratamento odontológico</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch('tratamento_odontologico') && (
                    <FormField
                      control={form.control}
                      name="observacoes_odontologicas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Odontológicas</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detalhes do tratamento..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saúde Mental */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Saúde Mental
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="historico_internacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico de Internações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva histórico de internações psiquiátricas..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="acompanhamento_psicologico"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Acompanhamento psicológico</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch('acompanhamento_psicologico') && (
                    <FormField
                      control={form.control}
                      name="detalhes_acompanhamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detalhes do Acompanhamento</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Profissional, frequência, etc..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tentativa_suicidio"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Histórico de tentativa de suicídio</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="historico_surtos"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Histórico de surtos</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alucinacoes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Alucinações</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medicamentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Uso de Medicamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="uso_medicamentos"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Faz uso de medicamentos</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('uso_medicamentos') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="descricao_medicamentos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição dos Medicamentos</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Liste os medicamentos..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tempo_uso_medicamentos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo de Uso</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 2 anos, 6 meses" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="modo_uso_medicamentos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modo de Uso</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 2x ao dia, conforme necessário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico Familiar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Histórico Familiar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="dependencia_quimica_familia"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Dependência química na família</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('dependencia_quimica_familia') && (
                <FormField
                  control={form.control}
                  name="detalhes_dependencia_familia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detalhes da Dependência Familiar</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o caso na família..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="observacoes_gerais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações Gerais</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Outras informações relevantes sobre a saúde..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Salvar Dados de Saúde
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}