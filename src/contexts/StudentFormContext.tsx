import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  studentHeaderSchema,
  studentBasicDataSchema,
  type StudentHeaderForm,
  type StudentBasicDataForm,
} from '@/lib/student-schemas';
import { useStudents } from '@/hooks/use-students';
import { useStudentWorkSituation } from '@/hooks/use-student-work-situation';
import { useStudentHealthData } from '@/hooks/use-student-health-data';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Work situation schema (duplicated from tab for context usage)
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

// Health data schema (duplicated from tab for context usage)
const healthDataSchema = z.object({
  teste_covid: z.string().optional(),
  resultado_covid: z.string().optional(),
  data_teste_covid: z.string().optional(),
  teste_ist: z.string().optional(),
  resultado_ist: z.string().optional(),
  data_teste_ist: z.string().optional(),
  tem_deficiencia: z.boolean().default(false),
  tipo_deficiencia: z.string().optional(),
  vacinacao_atualizada: z.boolean().default(false),
  tratamento_odontologico: z.boolean().default(false),
  observacoes_odontologicas: z.string().optional(),
  historico_internacoes: z.string().optional(),
  acompanhamento_psicologico: z.boolean().default(false),
  detalhes_acompanhamento: z.string().optional(),
  tentativa_suicidio: z.boolean().default(false),
  historico_surtos: z.boolean().default(false),
  alucinacoes: z.boolean().default(false),
  uso_medicamentos: z.boolean().default(false),
  descricao_medicamentos: z.string().optional(),
  tempo_uso_medicamentos: z.string().optional(),
  modo_uso_medicamentos: z.string().optional(),
  dependencia_quimica_familia: z.boolean().default(false),
  detalhes_dependencia_familia: z.string().optional(),
  observacoes_gerais: z.string().optional(),
});

export type WorkSituationForm = z.infer<typeof workSituationSchema>;
export type HealthDataForm = z.infer<typeof healthDataSchema>;

interface StudentFormContextType {
  // Form instances
  headerForm: UseFormReturn<StudentHeaderForm>;
  basicDataForm: UseFormReturn<StudentBasicDataForm>;
  workForm: UseFormReturn<WorkSituationForm>;
  healthForm: UseFormReturn<HealthDataForm>;

  // State
  studentId: string | null;
  isCreationMode: boolean;
  isSaving: boolean;
  isLoading: boolean;
  isDirty: boolean;

  // Actions
  saveAll: () => Promise<void>;
  resetAll: () => void;
}

const StudentFormContext = createContext<StudentFormContextType | null>(null);

interface StudentFormProviderProps {
  children: React.ReactNode;
  student?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentFormProvider({
  children,
  student,
  onSuccess,
  onCancel,
}: StudentFormProviderProps) {
  const { toast } = useToast();
  const { createStudent, updateStudent } = useStudents();
  const [studentId, setStudentId] = useState<string | null>(student?.id || null);
  const [isCreationMode, setIsCreationMode] = useState(!student);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!student);

  // Hook for work situation data
  const { workSituation, loading: workLoading, createOrUpdateWorkSituation } = useStudentWorkSituation(studentId || undefined);
  
  // Hook for health data
  const { healthData, loading: healthLoading, createOrUpdateHealthData } = useStudentHealthData(studentId || undefined);

  // Header Form
  const headerForm = useForm<StudentHeaderForm>({
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
      data_saida: student?.data_saida || '',
    },
  });

  // Basic Data Form
  const basicDataForm = useForm<StudentBasicDataForm>({
    resolver: zodResolver(studentBasicDataSchema),
    defaultValues: {
      batizado: 'Não',
      estuda: false,
      ha_processos: false,
      estado_mae: '',
      estado_pai: '',
      data_nascimento_mae_desconhecida: false,
      data_nascimento_pai_desconhecida: false,
      data_nascimento_conjuge_desconhecida: false,
    },
  });

  // Work Situation Form
  const workForm = useForm<WorkSituationForm>({
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

  // Health Data Form
  const healthForm = useForm<HealthDataForm>({
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

  // Auto-fill data_abertura when creating new student
  useEffect(() => {
    if (!student && !headerForm.getValues('data_abertura')) {
      const now = new Date();
      const formatted = now.toISOString().split('T')[0];
      headerForm.setValue('data_abertura', formatted);
    }
  }, [student, headerForm]);

  // Load basic data when studentId changes
  useEffect(() => {
    if (studentId) {
      loadBasicData();
    }
  }, [studentId]);

  // Sync work situation data to form
  useEffect(() => {
    if (workSituation) {
      workForm.reset({
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
  }, [workSituation, workForm]);

  // Sync health data to form
  useEffect(() => {
    if (healthData) {
      healthForm.reset({
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
  }, [healthData, healthForm]);

  const loadBasicData = async () => {
    try {
      const { data, error } = await supabase
        .from('student_basic_data')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const formData: StudentBasicDataForm = {
          telefone: data.telefone ?? undefined,
          endereco: data.endereco ?? undefined,
          cep: data.cep ?? undefined,
          numero: data.numero ?? undefined,
          bairro: data.bairro ?? undefined,
          cidade: data.cidade ?? undefined,
          estado: data.estado ?? undefined,
          estado_civil: data.estado_civil ?? undefined,
          religiao: data.religiao ?? undefined,
          batizado: data.batizado ?? 'Não',
          pis_nis: data.pis_nis ?? undefined,
          cartao_sus: data.cartao_sus ?? undefined,
          estado_nascimento: data.estado_nascimento ?? undefined,
          cidade_nascimento: data.cidade_nascimento ?? undefined,
          situacao_moradia: data.situacao_moradia ?? undefined,
          estuda: data.estuda ?? false,
          escolaridade: data.escolaridade ?? undefined,
          nome_pai: data.nome_pai ?? undefined,
          data_nascimento_pai: data.data_nascimento_pai ?? undefined,
          data_nascimento_pai_desconhecida: data.data_nascimento_pai_desconhecida ?? false,
          estado_pai: data.estado_pai || '',
          nome_mae: data.nome_mae ?? undefined,
          data_nascimento_mae: data.data_nascimento_mae ?? undefined,
          data_nascimento_mae_desconhecida: data.data_nascimento_mae_desconhecida ?? false,
          estado_mae: data.estado_mae || '',
          nome_conjuge: data.nome_conjuge ?? undefined,
          data_nascimento_conjuge: data.data_nascimento_conjuge ?? undefined,
          data_nascimento_conjuge_desconhecida: data.data_nascimento_conjuge_desconhecida ?? false,
          estado_conjuge: data.estado_conjuge ?? undefined,
          ha_processos: data.ha_processos ?? false,
          comarca_juridica: data.comarca_juridica ?? undefined,
          observacoes_juridicas: data.observacoes_juridicas ?? undefined,
        };
        basicDataForm.reset(formData);
      }
    } catch (error) {
      console.error('Error loading basic data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAll = useCallback(async () => {
    setIsSaving(true);

    try {
      // 1. Validate header form (required)
      const headerValid = await headerForm.trigger();
      if (!headerValid) {
        toast({
          title: 'Erro de validação',
          description: 'Corrija os erros na aba Registro antes de salvar.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // 2. Save header first (creates or updates student)
      let currentStudentId = studentId;
      const headerData = headerForm.getValues();

      if (!currentStudentId) {
        // Create new student
        const result = await createStudent({
          nome_completo: headerData.nome_completo || '',
          data_nascimento: headerData.data_nascimento || '',
          ativo: true,
          data_abertura: headerData.data_abertura || new Date().toISOString().split('T')[0],
          data_saida: headerData.data_saida ? headerData.data_saida.split('T')[0] : null,
          hora_saida: headerData.data_saida ? headerData.data_saida.split('T')[1]?.slice(0, 5) : null,
          numero_interno: headerData.numero_interno,
          hora_entrada: headerData.hora_entrada,
          cpf: headerData.cpf,
          rg: headerData.rg,
          nome_responsavel: headerData.nome_responsavel,
          parentesco_responsavel: headerData.parentesco_responsavel,
        });

        if (result.error) {
          toast({
            title: 'Erro',
            description: result.error,
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        currentStudentId = result.data?.id || null;
        if (currentStudentId) {
          setStudentId(currentStudentId);
          setIsCreationMode(false);
        }
      } else {
        // Update existing student
        const result = await updateStudent(currentStudentId, headerData);
        if (result.error) {
          toast({
            title: 'Erro',
            description: result.error,
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }

      if (!currentStudentId) {
        toast({
          title: 'Erro',
          description: 'Não foi possível obter o ID do aluno.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      // 3. Save secondary data in parallel
      const saveBasicData = async () => {
        const basicData = basicDataForm.getValues();
        return supabase
          .from('student_basic_data')
          .upsert({ ...basicData, student_id: currentStudentId }, { onConflict: 'student_id' });
      };

      const saveWorkData = async () => {
        const workData = workForm.getValues();
        return createOrUpdateWorkSituation({
          ...workData,
          valor_renda: workData.valor_renda ? parseFloat(workData.valor_renda) : null,
          renda_per_capita: workData.renda_per_capita ? parseFloat(workData.renda_per_capita) : null,
        });
      };

      const saveHealthData = async () => {
        const healthDataValues = healthForm.getValues();
        return createOrUpdateHealthData(healthDataValues);
      };

      await Promise.all([saveBasicData(), saveWorkData(), saveHealthData()]);

      // Reset dirty state for all forms
      headerForm.reset(headerForm.getValues());
      basicDataForm.reset(basicDataForm.getValues());
      workForm.reset(workForm.getValues());
      healthForm.reset(healthForm.getValues());

      toast({
        title: 'Sucesso',
        description: 'Todos os dados foram salvos com sucesso!',
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving all data:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    studentId,
    headerForm,
    basicDataForm,
    workForm,
    healthForm,
    createStudent,
    updateStudent,
    createOrUpdateWorkSituation,
    createOrUpdateHealthData,
    toast,
    onSuccess,
  ]);

  const resetAll = useCallback(() => {
    headerForm.reset();
    basicDataForm.reset();
    workForm.reset();
    healthForm.reset();
    onCancel();
  }, [headerForm, basicDataForm, workForm, healthForm, onCancel]);

  const isDirty = useMemo(() => {
    return (
      headerForm.formState.isDirty ||
      basicDataForm.formState.isDirty ||
      workForm.formState.isDirty ||
      healthForm.formState.isDirty
    );
  }, [
    headerForm.formState.isDirty,
    basicDataForm.formState.isDirty,
    workForm.formState.isDirty,
    healthForm.formState.isDirty,
  ]);

  const contextIsLoading = isLoading || workLoading || healthLoading;

  const value: StudentFormContextType = {
    headerForm,
    basicDataForm,
    workForm,
    healthForm,
    studentId,
    isCreationMode,
    isSaving,
    isLoading: contextIsLoading,
    isDirty,
    saveAll,
    resetAll,
  };

  return (
    <StudentFormContext.Provider value={value}>
      {children}
    </StudentFormContext.Provider>
  );
}

export function useStudentFormContext() {
  const context = useContext(StudentFormContext);
  if (!context) {
    throw new Error('useStudentFormContext must be used within a StudentFormProvider');
  }
  return context;
}
