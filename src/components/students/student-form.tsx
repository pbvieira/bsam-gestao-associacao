import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentHeaderSchema, type StudentHeaderForm } from '@/lib/student-schemas';
import { useStudents } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StudentBasicDataTab } from './tabs/student-basic-data-tab';
import { StudentChildrenTab } from './tabs/student-children-tab';
import { StudentWorkTab } from './tabs/student-work-tab';
import { StudentContactsTab } from './tabs/student-contacts-tab';
import { StudentHealthTab } from './tabs/student-health-tab';
import { StudentAnnotationsTab } from './tabs/student-annotations-tab';
import { StudentDocumentsTab } from './tabs/student-documents-tab';
import { StudentFormProvider, useStudentFormContext } from '@/contexts/StudentFormContext';

const PARENTESCO_OPTIONS = [
  "PAI",
  "MÃE",
  "AVÔ",
  "AVÓ",
  "IRMÃO(A)",
  "TIO(A)",
  "PASTOR",
  "ASSISTENTE SOCIAL",
  "ENCAMINHADO AD SEDE",
  "ESPOSA",
  "MADRINHA",
  "PADRINHO",
  "SOBRINHO(A)",
  "ENTEADO(A)",
  "FILHO(A)",
  "GENRO",
  "SOGRO(A)",
  "DESCONHECIDO",
  "PADRASTO",
  "MADASTRA",
  "AMIGO(A)"
];

const calculatePermanencia = (dataAbertura?: string, dataSaida?: string): string => {
  if (!dataAbertura) return '';
  
  const inicio = new Date(dataAbertura);
  const fim = dataSaida ? new Date(dataSaida) : new Date();
  
  const diffMs = fim.getTime() - inicio.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Data inválida';
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return '1 dia';
  if (diffDays < 30) return `${diffDays} dias`;
  
  if (diffDays < 365) {
    const meses = Math.floor(diffDays / 30);
    const dias = diffDays % 30;
    if (dias === 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    return `${meses} ${meses === 1 ? 'mês' : 'meses'} e ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }
  
  const anos = Math.floor(diffDays / 365);
  const restoDias = diffDays % 365;
  const meses = Math.floor(restoDias / 30);
  const dias = restoDias % 30;
  
  let result = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  if (meses > 0) result += `, ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  if (dias > 0) result += ` e ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  
  return result;
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [savedStudentId, setSavedStudentId] = useState<string | null>(student?.id || null);
  const [isCreationMode, setIsCreationMode] = useState(!student);
  
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
      data_saida: student?.data_saida || ''
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
        result = await updateStudent(idToUpdate, data);
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
          parentesco_responsavel: data.parentesco_responsavel
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

  // Global save handler
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Save header first (creates student if needed)
      const headerResult = await saveHeader();
      if (!headerResult.success) {
        return;
      }
      
      // 2. If we have a student ID, save all other forms
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="header">Registro</TabsTrigger>
          <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
          <TabsTrigger value="children">Filhos</TabsTrigger>
          <TabsTrigger value="work">Trabalho</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="health">Saúde</TabsTrigger>
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

                    <div></div> {/* Spacer */}

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

        <TabsContent value="annotations" forceMount className={activeTab !== 'annotations' ? 'hidden' : ''}>
          <StudentAnnotationsTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="documents" forceMount className={activeTab !== 'documents' ? 'hidden' : ''}>
          <StudentDocumentsTab studentId={savedStudentId} />
        </TabsContent>
      </Tabs>

      {/* Global Save/Cancel Footer */}
      <div className="sticky bottom-0 bg-background border-t py-4 -mx-6 px-6 flex justify-end gap-3">
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
  );
}
