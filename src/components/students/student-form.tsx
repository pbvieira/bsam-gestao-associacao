import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentHeaderSchema, type StudentHeaderForm } from '@/lib/student-schemas';
import { useStudents } from '@/hooks/use-students';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
interface StudentFormProps {
  student?: any;
  onSuccess: () => void;
  onCancel: () => void;
}
export function StudentForm({
  student,
  onSuccess,
  onCancel
}: StudentFormProps) {
  const {
    createStudent,
    updateStudent
  } = useStudents();
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('header');
  const [savedStudentId, setSavedStudentId] = useState<string | null>(student?.id || null);
  const [isCreationMode, setIsCreationMode] = useState(!student);
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
      parentesco_responsavel: student?.parentesco_responsavel || ''
    }
  });
  const onSubmit = async (data: StudentHeaderForm) => {
    setIsSubmitting(true);
    try {
      let result;
      if (student) {
        result = await updateStudent(student.id, data);
      } else {
        result = await createStudent({
          nome_completo: data.nome_completo || '',
          data_nascimento: data.data_nascimento || '',
          ativo: true,
          data_abertura: new Date().toISOString().split('T')[0],
          data_saida: null,
          hora_saida: null,
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
        return;
      }

      // If this was a creation, save the new student ID and exit creation mode
      if (!student && result.data) {
        setSavedStudentId(result.data.id);
        setIsCreationMode(false);
      }
      toast({
        title: 'Sucesso',
        description: student ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso! Agora você pode preencher as outras abas.'
      });

      // Only navigate away if this was an update, not creation
      if (student) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  return <div className="space-y-6">
      {isCreationMode && <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Preencha primeiro as informações principais do aluno. Após salvar, você poderá acessar as outras abas para completar o cadastro.
          </AlertDescription>
        </Alert>}
      
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
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                            <Input placeholder="Ex: Manhã, Tarde, 14:00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <div></div> {/* Spacer */}

                    <FormField control={form.control} name="nome_completo" render={({
                    field
                  }) => <FormItem className="md:col-span-2">
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

                    <FormField control={form.control} name="nome_responsavel" render={({
                    field
                  }) => <FormItem>
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
                            <Input placeholder="Ex: Pai, Mãe, Irmão, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <div className="flex justify-end gap-3 pt-6">
                    <Button type="button" variant="outline" onClick={onCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      {student ? 'Atualizar' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic">
          <StudentBasicDataTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="children">
          <StudentChildrenTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="work">
          <StudentWorkTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="contacts">
          <StudentContactsTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="health">
          <StudentHealthTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="annotations">
          <StudentAnnotationsTab studentId={savedStudentId} />
        </TabsContent>

        <TabsContent value="documents">
          <StudentDocumentsTab studentId={savedStudentId} />
        </TabsContent>
      </Tabs>
    </div>;
}