import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useStudentWorkSituation } from '@/hooks/use-student-work-situation';
import { useStudentIncome } from '@/hooks/use-student-income';
import { useStudentBenefits } from '@/hooks/use-student-benefits';
import { useBenefitTypes } from '@/hooks/use-benefit-types';
import { useIncomeTypes } from '@/hooks/use-income-types';
import { useWorkSituations } from '@/hooks/use-work-situations';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useStudentFormContext } from '@/contexts/StudentFormContext';

const workSituationSchema = z.object({
  situacao_trabalhista: z.string().optional(),
  profissao: z.string().optional(),
  empresa: z.string().optional(),
  funcao: z.string().optional(),
  data_admissao: z.string().optional(),
  contato_empresa: z.string().optional(),
  quantidade_pessoas_residencia: z.string().optional(),
});

type WorkSituationForm = z.infer<typeof workSituationSchema>;

interface StudentWorkTabProps {
  studentId?: string | null;
}



// New income form state
interface NewIncomeForm {
  tipo_renda: string;
  descricao: string;
  valor: string;
}

// New benefit form state
interface NewBenefitForm {
  tipo_beneficio: string;
  descricao: string;
  valor: string;
}

export function StudentWorkTab({ studentId }: StudentWorkTabProps) {
  const { workSituation, loading: workLoading, createOrUpdateWorkSituation } = useStudentWorkSituation(studentId || undefined);
  const { incomeList, loading: incomeLoading, totalIncome, addIncome, deleteIncome } = useStudentIncome(studentId || undefined);
  const { benefitsList, loading: benefitsLoading, totalBenefits, addBenefit, deleteBenefit } = useStudentBenefits(studentId || undefined);
  const { benefitTypes, fetchBenefitTypes } = useBenefitTypes();
  const { incomeTypes, fetchIncomeTypes } = useIncomeTypes();
  const { workSituations, fetchWorkSituations } = useWorkSituations();
  const { createTask, checkTaskExists } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const { registerWorkForm, registerWorkSave, headerForm } = useStudentFormContext();

  useEffect(() => {
    fetchBenefitTypes();
    fetchIncomeTypes();
    fetchWorkSituations();
  }, [fetchBenefitTypes, fetchIncomeTypes, fetchWorkSituations]);

  // New income form
  const [newIncome, setNewIncome] = useState<NewIncomeForm>({ tipo_renda: '', descricao: '', valor: '' });
  const [addingIncome, setAddingIncome] = useState(false);

  // New benefit form
  const [newBenefit, setNewBenefit] = useState<NewBenefitForm>({ tipo_beneficio: '', descricao: '', valor: '' });
  const [addingBenefit, setAddingBenefit] = useState(false);

  const form = useForm<WorkSituationForm>({
    resolver: zodResolver(workSituationSchema),
    defaultValues: {
      situacao_trabalhista: '',
      profissao: '',
      empresa: '',
      funcao: '',
      data_admissao: '',
      contato_empresa: '',
      quantidade_pessoas_residencia: '1',
    },
  });

  const quantidadePessoas = parseInt(form.watch('quantidade_pessoas_residencia') || '1') || 1;

  // Calculate per capita income
  const rendaPerCapita = useMemo(() => {
    const total = totalIncome + totalBenefits;
    if (quantidadePessoas <= 0) return 0;
    return total / quantidadePessoas;
  }, [totalIncome, totalBenefits, quantidadePessoas]);

  // Register form with context
  useEffect(() => {
    registerWorkForm(form);
  }, [form, registerWorkForm]);

  // Register save function with context
  const saveData = useCallback(async (): Promise<boolean> => {
    if (!studentId) return true; // No student yet, skip
    
    const isValid = await form.trigger();
    if (!isValid) return false;
    
    const data = form.getValues();
    
    try {
      const result = await createOrUpdateWorkSituation({
        ...data,
        quantidade_pessoas_residencia: parseInt(data.quantidade_pessoas_residencia || '1') || 1,
        renda_per_capita: rendaPerCapita,
        // Keep these for backward compatibility, but they won't be used anymore
        tipo_renda: null,
        valor_renda: null,
      });

      if (result?.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      // Lógica de criação automática de tarefa
      if (data.situacao_trabalhista && user) {
        const situacaoSelecionada = workSituations.find(
          s => s.nome === data.situacao_trabalhista
        );

        if (situacaoSelecionada?.gerar_tarefa) {
          // Verificar se já existe tarefa para este aluno e situação
          const tarefaExiste = await checkTaskExists(
            'student_work_situation',
            studentId,
            situacaoSelecionada.nome
          );

          if (!tarefaExiste) {
            // Obter nome do aluno do header form
            const nomeAluno = headerForm?.getValues('nome_completo') || 'Aluno';

            // Criar título substituindo placeholder
            const titulo = situacaoSelecionada.texto_tarefa
              ?.replace('{nome_aluno}', nomeAluno)
              || `Verificar situação de ${nomeAluno}`;

            try {
              await createTask({
                titulo,
                descricao: `Tarefa automática - Situação: ${situacaoSelecionada.nome}`,
                prioridade: (situacaoSelecionada.prioridade_tarefa as 'baixa' | 'media' | 'alta' | 'urgente') || 'media',
                status: 'pendente',
                created_by: user.id,
                assigned_to: user.id,
                setor_id: situacaoSelecionada.setor_tarefa_id || undefined,
                reference_type: 'student_work_situation',
                reference_id: studentId,
              });

              toast({
                title: 'Tarefa criada',
                description: `Tarefa criada automaticamente para situação "${situacaoSelecionada.nome}"`,
              });
            } catch (taskError) {
              console.error('Erro ao criar tarefa automática:', taskError);
              // Não impede o salvamento principal
            }
          }
        }
      }

      return true;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar situação trabalhista.',
        variant: 'destructive',
      });
      return false;
    }
  }, [studentId, form, createOrUpdateWorkSituation, toast, rendaPerCapita, workSituations, user, checkTaskExists, createTask, headerForm]);

  useEffect(() => {
    registerWorkSave(saveData);
  }, [saveData, registerWorkSave]);

  useEffect(() => {
    if (workSituation) {
      form.reset({
        situacao_trabalhista: workSituation.situacao_trabalhista || '',
        profissao: workSituation.profissao || '',
        empresa: workSituation.empresa || '',
        funcao: workSituation.funcao || '',
        data_admissao: workSituation.data_admissao || '',
        contato_empresa: workSituation.contato_empresa || '',
        quantidade_pessoas_residencia: workSituation.quantidade_pessoas_residencia?.toString() || '1',
      });
    }
  }, [workSituation, form]);

  // Handle add income
  const handleAddIncome = async () => {
    if (!newIncome.tipo_renda || !newIncome.valor) {
      toast({
        title: 'Erro',
        description: 'Preencha o tipo e o valor da renda.',
        variant: 'destructive',
      });
      return;
    }

    setAddingIncome(true);
    const result = await addIncome({
      tipo_renda: newIncome.tipo_renda,
      descricao: newIncome.descricao || undefined,
      valor: parseFloat(newIncome.valor) || 0,
    });

    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setNewIncome({ tipo_renda: '', descricao: '', valor: '' });
    }
    setAddingIncome(false);
  };

  // Handle delete income
  const handleDeleteIncome = async (id: string) => {
    const result = await deleteIncome(id);
    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Handle add benefit
  const handleAddBenefit = async () => {
    if (!newBenefit.tipo_beneficio || !newBenefit.valor) {
      toast({
        title: 'Erro',
        description: 'Preencha o tipo e o valor do benefício.',
        variant: 'destructive',
      });
      return;
    }

    setAddingBenefit(true);
    const result = await addBenefit({
      tipo_beneficio: newBenefit.tipo_beneficio,
      descricao: newBenefit.descricao || undefined,
      valor: parseFloat(newBenefit.valor) || 0,
    });

    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      setNewBenefit({ tipo_beneficio: '', descricao: '', valor: '' });
    }
    setAddingBenefit(false);
  };

  // Handle delete benefit
  const handleDeleteBenefit = async (id: string) => {
    const result = await deleteBenefit(id);
    if (result.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const loading = workLoading || incomeLoading || benefitsLoading;

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
      {/* Profissão e Emprego */}
      <Card>
        <CardHeader>
          <CardTitle>Profissão e Emprego</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
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
                        {workSituations.map((situation) => (
                          <SelectItem key={situation.id} value={situation.nome}>
                            {situation.nome}
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
          </Form>
        </CardContent>
      </Card>

      {/* Composição Familiar */}
      <Card>
        <CardHeader>
          <CardTitle>Composição Familiar</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <FormField
              control={form.control}
              name="quantidade_pessoas_residencia"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Quantidade de Pessoas na Residência</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="1" 
                      placeholder="1" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
      </Card>

      {/* Rendas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rendas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de Rendas */}
          {incomeList.length > 0 && (
            <div className="space-y-2">
              {incomeList.map((income) => (
                <div
                  key={income.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <span className="font-medium">
                      {incomeTypes.find(t => t.nome === income.tipo_renda)?.nome || income.tipo_renda}
                    </span>
                    <span className="text-muted-foreground">{income.descricao || '-'}</span>
                    <span className="font-semibold text-primary">{formatCurrency(income.valor)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteIncome(income.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário para adicionar nova renda */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Adicionar Nova Renda</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Renda</label>
                <Select
                  value={newIncome.tipo_renda}
                  onValueChange={(value) => setNewIncome(prev => ({ ...prev, tipo_renda: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeTypes.map((type) => (
                      <SelectItem key={type.id} value={type.nome}>
                        {type.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="Descrição (opcional)"
                  value={newIncome.descricao}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={newIncome.valor}
                  onChange={(e) => setNewIncome(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddIncome}
                  disabled={addingIncome || !studentId}
                  className="w-full"
                >
                  {addingIncome ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Total de Rendas */}
          <div className="flex justify-end pt-2 border-t">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Total de Rendas: </span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalIncome)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefícios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Benefícios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de Benefícios */}
          {benefitsList.length > 0 && (
            <div className="space-y-2">
              {benefitsList.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <span className="font-medium">
                      {benefitTypes.find(t => t.nome === benefit.tipo_beneficio)?.nome || benefit.tipo_beneficio}
                    </span>
                    <span className="text-muted-foreground">{benefit.descricao || '-'}</span>
                    <span className="font-semibold text-primary">{formatCurrency(benefit.valor)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBenefit(benefit.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário para adicionar novo benefício */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Adicionar Novo Benefício</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Benefício</label>
                <Select
                  value={newBenefit.tipo_beneficio}
                  onValueChange={(value) => setNewBenefit(prev => ({ ...prev, tipo_beneficio: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {benefitTypes.map((type) => (
                      <SelectItem key={type.id} value={type.nome}>
                        {type.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  placeholder="Descrição (opcional)"
                  value={newBenefit.descricao}
                  onChange={(e) => setNewBenefit(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={newBenefit.valor}
                  onChange={(e) => setNewBenefit(prev => ({ ...prev, valor: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddBenefit}
                  disabled={addingBenefit || !studentId}
                  className="w-full"
                >
                  {addingBenefit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Total de Benefícios */}
          <div className="flex justify-end pt-2 border-t">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Total de Benefícios: </span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalBenefits)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Rendas</p>
              <p className="text-xl font-bold">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-4 bg-background rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Total de Benefícios</p>
              <p className="text-xl font-bold">{formatCurrency(totalBenefits)}</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">
                Renda Per Capita ({quantidadePessoas} {quantidadePessoas === 1 ? 'pessoa' : 'pessoas'})
              </p>
              <p className="text-xl font-bold text-primary">{formatCurrency(rendaPerCapita)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ({formatCurrency(totalIncome + totalBenefits)} ÷ {quantidadePessoas})
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
