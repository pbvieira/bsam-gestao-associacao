import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { StudentFormProvider, useStudentFormContext } from '@/contexts/StudentFormContext';
import { StudentBasicDataTab } from './tabs/student-basic-data-tab';
import { StudentChildrenTab } from './tabs/student-children-tab';
import { StudentWorkTab } from './tabs/student-work-tab';
import { StudentContactsTab } from './tabs/student-contacts-tab';
import { StudentHealthTab } from './tabs/student-health-tab';
import { StudentAnnotationsTab } from './tabs/student-annotations-tab';
import { StudentDocumentsTab } from './tabs/student-documents-tab';

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

const calculatePermanencia = (dataAbertura?: string | null, dataSaida?: string | null): string => {
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
    <StudentFormProvider
      student={props.student}
      onSuccess={props.onSuccess}
      onCancel={props.onCancel}
    >
      <StudentFormContent {...props} />
    </StudentFormProvider>
  );
}

function StudentFormContent({ student, onRefreshPhoto }: StudentFormProps) {
  const {
    headerForm,
    studentId,
    isCreationMode,
    isSaving,
    isDirty,
    saveAll,
    resetAll,
  } = useStudentFormContext();

  const [activeTab, setActiveTab] = useState('header');

  // Watch for changes to calculate permanencia
  const dataAbertura = headerForm.watch('data_abertura');
  const dataSaida = headerForm.watch('data_saida');
  const permanencia = calculatePermanencia(dataAbertura, dataSaida);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Recarregar foto quando acessar aba de documentos (caso tenha upload novo)
    if (value === 'documents' && onRefreshPhoto) {
      onRefreshPhoto();
    }
  };

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
        <div className="flex items-center justify-between mb-2">
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
        </div>

        {isDirty && (
          <div className="mb-4">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Alterações pendentes
            </Badge>
          </div>
        )}

        <TabsContent value="header" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações Principais</CardTitle>
              {student?.nome_completo && (
                <p className="text-sm text-muted-foreground">{student.nome_completo}</p>
              )}
            </CardHeader>
            <CardContent>
              <Form {...headerForm}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={headerForm.control}
                      name="numero_interno"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número Interno</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de controle interno" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="hora_entrada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário de Entrada</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="data_abertura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Abertura</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="nome_completo"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-3">
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do aluno" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="data_saida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data e Hora de Saída</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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

                    <FormField
                      control={headerForm.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input placeholder="000.000.000-00" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input placeholder="00.000.000-0" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div></div> {/* Spacer */}

                    <FormField
                      control={headerForm.control}
                      name="nome_responsavel"
                      render={({ field }) => (
                        <FormItem className="lg:col-span-2">
                          <FormLabel>Nome do Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da pessoa de referência" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={headerForm.control}
                      name="parentesco_responsavel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parentesco do Responsável</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic" forceMount className={activeTab !== 'basic' ? 'hidden' : ''}>
          <StudentBasicDataTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="children" forceMount className={activeTab !== 'children' ? 'hidden' : ''}>
          <StudentChildrenTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="work" forceMount className={activeTab !== 'work' ? 'hidden' : ''}>
          <StudentWorkTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="contacts" forceMount className={activeTab !== 'contacts' ? 'hidden' : ''}>
          <StudentContactsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="health" forceMount className={activeTab !== 'health' ? 'hidden' : ''}>
          <StudentHealthTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="annotations" forceMount className={activeTab !== 'annotations' ? 'hidden' : ''}>
          <StudentAnnotationsTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="documents" forceMount className={activeTab !== 'documents' ? 'hidden' : ''}>
          <StudentDocumentsTab studentId={studentId} />
        </TabsContent>
      </Tabs>

      {/* Global action footer */}
      <div className="sticky bottom-0 bg-background border-t p-4 flex justify-end gap-3 -mx-6 -mb-6 mt-6">
        <Button type="button" variant="outline" onClick={resetAll}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button onClick={saveAll} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>
    </div>
  );
}
