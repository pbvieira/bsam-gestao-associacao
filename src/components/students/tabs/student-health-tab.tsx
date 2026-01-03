import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useStudentHealthData } from '@/hooks/use-student-health-data';
import { useStudentMedications, StudentMedication, MedicationInput, ScheduleInput } from '@/hooks/use-student-medications';
import { useStudentHospitalizations, HOSPITALIZATION_TYPES, StudentHospitalization } from '@/hooks/use-student-hospitalizations';
import { useStudentMedicalRecords, MEDICAL_RECORD_TYPES, StudentMedicalRecord } from '@/hooks/use-student-medical-records';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, Pill, Users, Plus, Pencil, Trash2, Clock, Calendar, Building2, FileText, Stethoscope, CalendarClock } from 'lucide-react';
import { useStudentFormContext } from '@/contexts/StudentFormContext';
import { MedicationDialog } from './medication-dialog';
import { HospitalizationDialog } from './hospitalization-dialog';
import { MedicalRecordDialog } from './medical-record-dialog';
import { StudentVaccinesSection } from './student-vaccines-section';
import { StudentDiseasesSection } from './student-diseases-section';
import { StudentDisabilitiesSection } from './student-disabilities-section';

const healthDataSchema = z.object({
  // Tratamentos
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
  studentId?: string | null;
}

export function StudentHealthTab({ studentId }: StudentHealthTabProps) {
  const { healthData, loading, createOrUpdateHealthData } = useStudentHealthData(studentId || undefined);
  const { medications, loading: loadingMeds, createMedication, updateMedication, deleteMedication, toggleMedicationStatus } = useStudentMedications(studentId || undefined);
  const { hospitalizations, loading: loadingHosp, createHospitalization, updateHospitalization, deleteHospitalization } = useStudentHospitalizations(studentId || undefined);
  const { medicalRecords, loading: loadingRecords, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = useStudentMedicalRecords(studentId || undefined);
  const { toast } = useToast();
  const { registerHealthForm, registerHealthSave } = useStudentFormContext();
  
  const [medicationDialogOpen, setMedicationDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<StudentMedication | null>(null);
  
  const [hospitalizationDialogOpen, setHospitalizationDialogOpen] = useState(false);
  const [editingHospitalization, setEditingHospitalization] = useState<StudentHospitalization | null>(null);
  
  const [medicalRecordDialogOpen, setMedicalRecordDialogOpen] = useState(false);
  const [editingMedicalRecord, setEditingMedicalRecord] = useState<StudentMedicalRecord | null>(null);

  const form = useForm<HealthDataForm>({
    resolver: zodResolver(healthDataSchema),
    defaultValues: {
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

  // Register form with context
  useEffect(() => {
    registerHealthForm(form);
  }, [form, registerHealthForm]);

  // Register save function with context
  const saveData = useCallback(async (): Promise<boolean> => {
    if (!studentId) return true; // No student yet, skip
    
    const isValid = await form.trigger();
    if (!isValid) return false;
    
    const data = form.getValues();
    
    try {
      const result = await createOrUpdateHealthData(data);

      if (result?.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados de saúde.',
        variant: 'destructive',
      });
      return false;
    }
  }, [studentId, form, createOrUpdateHealthData, toast]);

  useEffect(() => {
    registerHealthSave(saveData);
  }, [saveData, registerHealthSave]);

  useEffect(() => {
    if (healthData) {
      form.reset({
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

  const getHospitalizationTypeLabel = (value: string) => {
    return HOSPITALIZATION_TYPES.find(t => t.value === value)?.label || value;
  };

  const getMedicalRecordTypeLabel = (value: string) => {
    return MEDICAL_RECORD_TYPES.find(t => t.value === value)?.label || value;
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
    <div className="space-y-6">
      <Form {...form}>
        <div className="space-y-6">
          {/* Prontuário Médico */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Prontuário Médico
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingMedicalRecord(null);
                    setMedicalRecordDialogOpen(true);
                  }}
                  disabled={!studentId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Atendimento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!studentId && (
                <p className="text-sm text-muted-foreground">
                  Salve o aluno primeiro para registrar atendimentos.
                </p>
              )}

              {studentId && loadingRecords && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando prontuário...</span>
                </div>
              )}

              {studentId && !loadingRecords && medicalRecords.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum atendimento registrado.
                </p>
              )}

              {studentId && !loadingRecords && medicalRecords.length > 0 && (
                <div className="space-y-3">
                  {/* Estatísticas */}
                  <div className="flex gap-4 text-sm text-muted-foreground pb-2 border-b flex-wrap">
                    <span>Total: <strong className="text-foreground">{medicalRecords.length}</strong></span>
                    <span>Retornos pendentes: <strong className="text-foreground">
                      {medicalRecords.filter(r => r.data_retorno && new Date(r.data_retorno) >= new Date()).length}
                    </strong></span>
                  </div>

                  {medicalRecords.map((record) => {
                    const hasUpcomingReturn = record.data_retorno && new Date(record.data_retorno) >= new Date();
                    const isPastReturn = record.data_retorno && new Date(record.data_retorno) < new Date();
                    
                    return (
                      <div 
                        key={record.id} 
                        className={`border rounded-lg p-4 ${hasUpcomingReturn ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge variant="secondary">
                                {getMedicalRecordTypeLabel(record.tipo_atendimento)}
                              </Badge>
                              {record.especialidade && (
                                <Badge variant="outline">{record.especialidade}</Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(record.data_atendimento), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {hasUpcomingReturn && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  Retorno: {format(new Date(record.data_retorno!), 'dd/MM/yyyy', { locale: ptBR })}
                                </Badge>
                              )}
                              {isPastReturn && (
                                <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">
                                  Retorno vencido
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-1">
                              {record.profissional && (
                                <p className="text-sm font-medium">{record.profissional}</p>
                              )}
                              {record.local && (
                                <p className="text-sm text-muted-foreground">{record.local}</p>
                              )}
                              {record.motivo && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Motivo:</strong> {record.motivo}
                                </p>
                              )}
                              {record.diagnostico && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Diagnóstico:</strong> {record.diagnostico}
                                </p>
                              )}
                              {record.prescricao && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Prescrição:</strong> {record.prescricao}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMedicalRecord(record);
                                setMedicalRecordDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm('Excluir este registro de atendimento?')) {
                                  await deleteMedicalRecord(record.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <MedicalRecordDialog
            open={medicalRecordDialogOpen}
            onOpenChange={setMedicalRecordDialogOpen}
            medicalRecord={editingMedicalRecord}
            onSave={createMedicalRecord}
            onUpdate={updateMedicalRecord}
          />

          {/* Medicamentos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medicamentos
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingMedication(null);
                    setMedicationDialogOpen(true);
                  }}
                  disabled={!studentId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Medicamento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!studentId && (
                <p className="text-sm text-muted-foreground">
                  Salve o aluno primeiro para cadastrar medicamentos.
                </p>
              )}

              {studentId && loadingMeds && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando medicamentos...</span>
                </div>
              )}

              {studentId && !loadingMeds && medications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum medicamento cadastrado. Clique em "Novo Medicamento" para adicionar.
                </p>
              )}

              {studentId && !loadingMeds && medications.length > 0 && (
                <div className="space-y-3">
                  {medications.map((med) => {
                    const isExpired = med.data_fim && new Date(med.data_fim) < new Date();
                    const isContinuous = !med.data_fim;
                    
                    return (
                      <div 
                        key={med.id} 
                        className={`border rounded-lg p-4 ${!med.ativo ? 'opacity-60 bg-muted/50' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{med.nome_medicamento}</h4>
                              {med.dosagem && (
                                <Badge variant="outline">{med.dosagem}</Badge>
                              )}
                              {med.tipo_uso && (
                                <Badge 
                                  variant="secondary"
                                  style={{ backgroundColor: `${med.tipo_uso.cor}20`, color: med.tipo_uso.cor }}
                                >
                                  {med.tipo_uso.nome}
                                </Badge>
                              )}
                              {isContinuous && med.ativo && (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
                                  🔄 Contínuo
                                </Badge>
                              )}
                              {!isContinuous && med.ativo && !isExpired && med.data_fim && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                                  📅 Até {new Date(med.data_fim).toLocaleDateString('pt-BR')}
                                </Badge>
                              )}
                              {isExpired && med.ativo && (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                                  ⚠️ Vencido
                                </Badge>
                              )}
                              {!med.ativo && (
                                <Badge variant="destructive">Inativo</Badge>
                              )}
                            </div>
                            {med.principio_ativo && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Princípio ativo: {med.principio_ativo}
                              </p>
                            )}
                            {med.schedules && med.schedules.length > 0 && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {med.schedules.map((sched, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                    <Clock className="h-3 w-3" />
                                    <span>{sched.horario.slice(0, 5)}</span>
                                    {sched.gerar_evento && (
                                      <Calendar className="h-3 w-3 text-primary ml-1" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={med.ativo}
                              onCheckedChange={(checked) => toggleMedicationStatus(med.id, checked)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingMedication(med);
                                setMedicationDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm('Excluir este medicamento?')) {
                                  const result = await deleteMedication(med.id);
                                  if (result.error) {
                                    toast({ title: 'Erro', description: result.error, variant: 'destructive' });
                                  } else {
                                    toast({ title: 'Medicamento excluído' });
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <MedicationDialog
            open={medicationDialogOpen}
            onOpenChange={setMedicationDialogOpen}
            medication={editingMedication}
            onSave={async (data: MedicationInput, schedules: ScheduleInput[]) => {
              if (editingMedication) {
                return await updateMedication(editingMedication.id, data, schedules);
              } else {
                return await createMedication(data, schedules);
              }
            }}
          />

          {/* Vacinas */}
          <StudentVaccinesSection studentId={studentId} />

          {/* Doenças - Seção dinâmica */}
          <StudentDiseasesSection studentId={studentId || undefined} />

          {/* Deficiências - Seção dinâmica */}
          <StudentDisabilitiesSection studentId={studentId || undefined} />

          {/* Histórico de Internações */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Histórico de Internações
                </CardTitle>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setEditingHospitalization(null);
                    setHospitalizationDialogOpen(true);
                  }}
                  disabled={!studentId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Internação
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!studentId && (
                <p className="text-sm text-muted-foreground">
                  Salve o aluno primeiro para registrar internações.
                </p>
              )}

              {studentId && loadingHosp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando internações...</span>
                </div>
              )}

              {studentId && !loadingHosp && hospitalizations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma internação registrada.
                </p>
              )}

              {studentId && !loadingHosp && hospitalizations.length > 0 && (
                <div className="space-y-3">
                  {/* Estatísticas */}
                  <div className="flex gap-4 text-sm text-muted-foreground pb-2 border-b">
                    <span>Total: <strong className="text-foreground">{hospitalizations.length}</strong></span>
                    <span>Internado atualmente: <strong className="text-foreground">
                      {hospitalizations.filter(h => !h.data_saida).length > 0 ? 'Sim' : 'Não'}
                    </strong></span>
                  </div>

                  {hospitalizations.map((hosp) => {
                    const isCurrentlyHospitalized = !hosp.data_saida;
                    
                    return (
                      <div 
                        key={hosp.id} 
                        className={`border rounded-lg p-4 ${isCurrentlyHospitalized ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge variant="secondary">
                                {getHospitalizationTypeLabel(hosp.tipo_internacao)}
                              </Badge>
                              {isCurrentlyHospitalized && (
                                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                                  🏥 Internado
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(hosp.data_entrada), 'dd/MM/yyyy', { locale: ptBR })}
                                {hosp.data_saida && ` - ${format(new Date(hosp.data_saida), 'dd/MM/yyyy', { locale: ptBR })}`}
                              </span>
                            </div>
                            
                            {hosp.local && (
                              <p className="text-sm font-medium">{hosp.local}</p>
                            )}
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Motivo:</strong> {hosp.motivo}
                            </p>
                            
                            {hosp.diagnostico && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Diagnóstico:</strong> {hosp.diagnostico}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingHospitalization(hosp);
                                setHospitalizationDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (confirm('Excluir este registro de internação?')) {
                                  await deleteHospitalization(hosp.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <HospitalizationDialog
            open={hospitalizationDialogOpen}
            onOpenChange={setHospitalizationDialogOpen}
            hospitalization={editingHospitalization}
            onSave={createHospitalization}
            onUpdate={updateHospitalization}
          />

          {/* Saúde Mental */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Saúde Mental
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                            <Textarea placeholder="Profissional, frequência..." {...field} />
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
                          <FormLabel>Apresenta alucinações</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                      <FormLabel>Histórico de dependência química na família</FormLabel>
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
                      <FormLabel>Detalhes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descreva o histórico familiar..." {...field} />
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
        </div>
      </Form>
    </div>
  );
}
