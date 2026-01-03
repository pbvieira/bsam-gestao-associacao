import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInDays, differenceInMonths, differenceInYears, isValid, parseISO, addYears, addMonths } from 'date-fns';
import { studentHeaderSchema, type StudentHeaderForm, PARENTESCO_OPTIONS } from '@/lib/student-schemas';
import { useStudents } from '@/hooks/use-students';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, AlertCircle, Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudentBasicDataTab } from './tabs/student-basic-data-tab';
import { StudentChildrenTab } from './tabs/student-children-tab';
import { StudentWorkTab } from './tabs/student-work-tab';
import { StudentContactsTab } from './tabs/student-contacts-tab';
import { StudentHealthTab } from './tabs/student-health-tab';
import { StudentCashBookTab } from './tabs/student-cash-book-tab';
import { StudentAnnotationsTab } from './tabs/student-annotations-tab';
import { StudentDocumentsTab } from './tabs/student-documents-tab';
import { StudentFormProvider, useStudentFormContext } from '@/contexts/StudentFormContext';

const calculatePermanencia = (dataAbertura?: string, dataSaida?: string): string => {
  // Validar data de abertura (rejeitar vazio ou undefined)
  if (!dataAbertura || dataAbertura.trim() === '') return '';
  
  const inicio = parseISO(dataAbertura);
  if (!isValid(inicio)) return '';
  
  // Usar data atual APENAS se data_saida estiver vazia ou undefined
  let fim: Date;
  if (dataSaida && dataSaida.trim() !== '') {
    // Tratar datetime-local (formato "2024-01-15T10:30")
    const dataParte = dataSaida.split('T')[0];
    const dataSaidaParsed = parseISO(dataParte);
    fim = isValid(dataSaidaParsed) ? dataSaidaParsed : new Date();
  } else {
    fim = new Date(); // Sem data de saída = usa data atual
  }
  
  const totalDias = differenceInDays(fim, inicio);
  
  if (totalDias < 0) return 'Data inválida';
  if (totalDias === 0) return 'Hoje';
  if (totalDias === 1) return '1 dia';
  if (totalDias < 30) return `${totalDias} dias`;
  
  // Calcular usando date-fns para precisão de calendário real
  const anos = differenceInYears(fim, inicio);
  const mesesTotais = differenceInMonths(fim, inicio);
  const meses = mesesTotais % 12;
  
  // Calcular dias restantes após anos e meses completos
  let dataAposMeses = addYears(inicio, anos);
  dataAposMeses = addMonths(dataAposMeses, meses);
  const diasRestantes = differenceInDays(fim, dataAposMeses);
  
  let result = '';
  
  if (anos > 0) {
    result = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }
  
  if (meses > 0) {
    if (result) result += ', ';
    result += `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }
  
  if (diasRestantes > 0) {
    if (result) result += ' e ';
    result += `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
  }
  
  return result || 'Hoje';
};

interface StudentFormProps {
  student?: any;
  onSuccess: () => void;
  onCancel: () => void;
  onRefreshPhoto?: () => void;
}

export function StudentForm(props: StudentFormProps) {
  return (
    <StudentFormProvider initialStudentId={props.student?.id || null}>
      <StudentFormContent {...props} />
    </StudentFormProvider>
  );
}

function StudentFormContent({
  student,
  onSuccess,
  onCancel,
  onRefreshPhoto
}: StudentFormProps) {
  const { createStudent, updateStudent } = useStudents();
  const { createTask } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [savedStudentId, setSavedStudentId] = useState<string | null>(student?.id || null);
  const [isCreationMode, setIsCreationMode] = useState(!student);
  const [wasNewStudent, setWasNewStudent] = useState(!student);
  
  const { registerHeaderForm, setStudentId, saveAll, isSaving } = useStudentFormContext();
  
  const form = useForm<StudentHeaderForm>({
    resolver: zodResolver(studentHeaderSchema),
    defaultValues: {
      numero_interno: student?.numero_interno || '',
      hora_entrada: student?.hora_entrada || '',
      nome_completo: student?.nome_completo || '',
      data_nascimento: student?.data_nascimento || '',
      cpf: student?.cpf || '',
      rg: student?.rg || '',
      nome_responsavel: student?.nome_responsavel || '',
      parentesco_responsavel: student?.parentesco_responsavel || '',
      data_abertura: student?.data_abertura || '',
      data_saida: student?.data_saida 
        ? `${student.data_saida}T${student.hora_saida || '00:00'}` 
        : '',
      nao_possui_documentos: student?.nao_possui_documentos || false
    }
  });

  // Register header form with context
  useEffect(() => {
    registerHeaderForm(form);
  }, [form, registerHeaderForm]);

  // Auto-fill data_abertura when creating new student
  useEffect(() => {
    if (!student && !form.getValues('data_abertura')) {
      const now = new Date();
      const formatted = now.toISOString().split('T')[0];
      form.setValue('data_abertura', formatted);
    }
  }, [student, form]);

  // Watch for changes to calculate permanencia
  const dataAbertura = form.watch('data_abertura');
  const dataSaida = form.watch('data_saida');
  const permanencia = calculatePermanencia(dataAbertura, dataSaida);
  
  // Save header (student main record)
  const saveHeader = async (): Promise<{ success: boolean; newStudentId?: string }> => {
    const isValid = await form.trigger();
    if (!isValid) {
      return { success: false };
    }
    
    const data = form.getValues();
    
    try {
      let result;
      if (student || savedStudentId) {
        const idToUpdate = savedStudentId || student.id;
        // Extrair data e hora do campo datetime-local
        const updateData = {
          ...data,
          data_saida: data.data_saida ? data.data_saida.split('T')[0] : null,
          hora_saida: data.data_saida ? data.data_saida.split('T')[1]?.slice(0, 5) : null,
        };
        result = await updateStudent(idToUpdate, updateData);
      } else {
        result = await createStudent({
          nome_completo: data.nome_completo || '',
          data_nascimento: data.data_nascimento || '',
          ativo: true,
          data_abertura: data.data_abertura || new Date().toISOString().split('T')[0],
          data_saida: data.data_saida ? data.data_saida.split('T')[0] : null,
          hora_saida: data.data_saida ? data.data_saida.split('T')[1]?.slice(0, 5) : null,
          numero_interno: data.numero_interno,
          hora_entrada: data.hora_entrada,
          cpf: data.cpf,
          rg: data.rg,
          nome_responsavel: data.nome_responsavel,
          parentesco_responsavel: data.parentesco_responsavel,
          nao_possui_documentos: data.nao_possui_documentos
        });
      }
      
      if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive'
        });
        return { success: false };
      }

      // If this was a creation, save the new student ID
      if (!student && !savedStudentId && result.data) {
        const newId = result.data.id;
        setSavedStudentId(newId);
        setStudentId(newId);
        setIsCreationMode(false);
        return { success: true, newStudentId: newId };
      }
      
      return { success: true };
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
      return { success: false };
    }
  };

  // Function to create task for missing documents
  const createDocumentationTask = async (studentName: string) => {
    if (!user?.id) return;
    
    try {
      // Find "Atendimento Social" sector
      const { data: setorData } = await supabase
        .from('setores')
        .select('id')
        .ilike('nome', '%Atendimento Social%')
        .limit(1)
        .single();
      
      await createTask({
        titulo: `Providenciar documentação do aluno ${studentName}`,
        descricao: 'O aluno foi cadastrado sem documentação. Necessário providenciar RG, CPF e demais documentos.',
        prioridade: 'alta',
        status: 'pendente',
        created_by: user.id,
        assigned_to: user.id,
        setor_id: setorData?.id || undefined,
      });
      
      toast({
        title: 'Tarefa criada',
        description: 'Uma tarefa foi criada para providenciar a documentação do aluno.'
      });
    } catch (error) {
      console.error('Error creating documentation task:', error);
    }
  };

  // Global save handler
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Save header first (creates student if needed)
      const headerResult = await saveHeader();
      if (!headerResult.success) {
        return;
      }
      
      // 2. Check if we need to create a documentation task (only for new students)
      const formData = form.getValues();
      if (wasNewStudent && headerResult.newStudentId && formData.nao_possui_documentos) {
        await createDocumentationTask(formData.nome_completo);
        setWasNewStudent(false); // Prevent creating task again on subsequent saves
      }
      
      // 3. If we have a student ID, save all other forms
      const currentStudentId = headerResult.newStudentId || savedStudentId;
      if (currentStudentId) {
        const allSaved = await saveAll();
        if (allSaved) {
          toast({
            title: 'Sucesso',
            description: 'Todos os dados foram salvos com sucesso!'
          });
          // Permanece no formulário após salvar
        }
      } else {
        // Just created, show success for header
        toast({
          title: 'Sucesso',
          description: 'Aluno cadastrado com sucesso! Preencha as outras abas e salve novamente.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Recarregar foto quando acessar aba de documentos
    if (value === 'documents' && onRefreshPhoto) {
      onRefreshPhoto();
    }
  };

  const globalSaving = isSubmitting || isSaving;

  return (
    <div className="space-y-6">
      {isCreationMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preencha primeiro as informações principais do aluno. Após salvar, você poderá acessar as outras abas para completar o cadastro.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="header">Registro</TabsTrigger>
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="children">Filhos</TabsTrigger>
          <TabsTrigger value="work">Trabalho</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="health">Saúde</TabsTrigger>
          <TabsTrigger value="cashbook">Financeiro</TabsTrigger>
          <TabsTrigger value="annotations">Anotações</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Principais</CardTitle>
              {student?.nome_completo && (
                <p className="text-sm text-muted-foreground">{student.nome_completo}</p>
              )}
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField control={form.control} name="numero_interno" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Número Interno</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de controle interno" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="hora_entrada" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Horário de Entrada</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o horário de entrada" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ENTRE - 00H00 ÀS 12H00">ENTRE - 00H00 ÀS 12H00</SelectItem>
                                <SelectItem value="ENTRE - 12H01 ÀS 18H00">ENTRE - 12H01 ÀS 18H00</SelectItem>
                                <SelectItem value="ENTRE - 18H01 ÀS 00H00">ENTRE - 18H01 ÀS 00H00</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="data_abertura" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Data de Abertura</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="nome_completo" render={({
                    field
                  }) => <FormItem className="lg:col-span-3">
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do aluno" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="data_nascimento" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Data de Nascimento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="data_saida" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Data e Hora de Saída</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormItem>
                      <FormLabel>Permanência</FormLabel>
                      <FormControl>
                        <Input 
                          value={permanencia} 
                          disabled 
                          className="bg-muted"
                        />
                      </FormControl>
                    </FormItem>

                    <FormField control={form.control} name="cpf" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="rg" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000-0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField 
                      control={form.control} 
                      name="nao_possui_documentos" 
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-6">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Não possui documentos
                          </FormLabel>
                        </FormItem>
                      )} 
                    />

                    <FormField control={form.control} name="nome_responsavel" render={({
                    field
                  }) => <FormItem className="lg:col-span-2">
                          <FormLabel>Nome do Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da pessoa de referência" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="parentesco_responsavel" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Parentesco do Responsável</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o parentesco" />
                              </SelectTrigger>
                              <SelectContent>
                                {PARENTESCO_OPTIONS.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic" forceMount className={activeTab !== 'basic' ? 'hidden' : ''}>
          <StudentBasicDataTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="children" forceMount className={activeTab !== 'children' ? 'hidden' : ''}>
          <StudentChildrenTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="work" forceMount className={activeTab !== 'work' ? 'hidden' : ''}>
          <StudentWorkTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="contacts" forceMount className={activeTab !== 'contacts' ? 'hidden' : ''}>
          <StudentContactsTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="health" forceMount className={activeTab !== 'health' ? 'hidden' : ''}>
          <StudentHealthTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="cashbook" forceMount className={activeTab !== 'cashbook' ? 'hidden' : ''}>
          <StudentCashBookTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="annotations" forceMount className={activeTab !== 'annotations' ? 'hidden' : ''}>
          <StudentAnnotationsTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="documents" forceMount className={activeTab !== 'documents' ? 'hidden' : ''}>
          <StudentDocumentsTab studentId={savedStudentId} />
        </TabsContent>
      </Tabs>

      {/* Global Save/Cancel Footer */}
      <div className="sticky bottom-0 bg-background border-t py-4 -mx-6 px-6 flex justify-between">
        <div>
          {savedStudentId && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => window.open(`/alunos/${savedStudentId}/imprimir`, '_blank')}
              disabled={globalSaving}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Ficha
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={globalSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSaveAll} disabled={globalSaving}>
            {globalSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
