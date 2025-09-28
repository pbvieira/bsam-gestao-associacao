import { z } from 'zod';

// Main student schema
export const studentHeaderSchema = z.object({
  numero_interno: z.string().optional(),
  hora_entrada: z.string().optional(),
  nome_completo: z.string().min(1, 'Nome completo é obrigatório').max(255),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  nome_responsavel: z.string().optional(),
  parentesco_responsavel: z.string().optional(),
});

// Basic data schema
export const studentBasicDataSchema = z.object({
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cep: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  estado_civil: z.string().optional(),
  religiao: z.string().optional(),
  batizado: z.boolean().default(false),
  pis_nis: z.string().optional(),
  cartao_sus: z.string().optional(),
  estado_nascimento: z.string().optional(),
  cidade_nascimento: z.string().optional(),
  situacao_moradia: z.string().optional(),
  escolaridade: z.string().optional(),
  nome_pai: z.string().optional(),
  data_nascimento_pai: z.string().optional(),
  estado_pai: z.string().optional(),
  nome_mae: z.string().optional(),
  data_nascimento_mae: z.string().optional(),
  estado_mae: z.string().optional(),
  nome_conjuge: z.string().optional(),
  data_nascimento_conjuge: z.string().optional(),
  estado_conjuge: z.string().optional(),
  comarca_juridica: z.string().optional(),
  observacoes_juridicas: z.string().optional(),
});

// Children schema
export const studentChildrenSchema = z.object({
  tem_filhos: z.boolean().default(false),
  quantidade_filhos: z.number().default(0),
  convive_filhos: z.boolean().default(false),
});

export const childSchema = z.object({
  nome_completo: z.string().min(1, 'Nome é obrigatório'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
});

// Work situation schema
export const studentWorkSituationSchema = z.object({
  profissao: z.string().optional(),
  situacao_trabalhista: z.string().optional(),
  empresa: z.string().optional(),
  funcao: z.string().optional(),
  data_admissao: z.string().optional(),
  contato_empresa: z.string().optional(),
  tipo_renda: z.string().optional(),
  valor_renda: z.number().optional(),
});

// Emergency contacts schema
export const emergencyContactSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  parentesco: z.string().optional(),
  endereco: z.string().optional(),
  avisar_contato: z.boolean().default(true),
});

// Health data schema
export const studentHealthDataSchema = z.object({
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

// Annotation schema
export const studentAnnotationSchema = z.object({
  tipo: z.enum(['anotacao']),
  categoria: z.string().optional(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  data_evento: z.string().min(1, 'Data do evento é obrigatória'),
});

export type StudentHeaderForm = z.infer<typeof studentHeaderSchema>;
export type StudentBasicDataForm = z.infer<typeof studentBasicDataSchema>;
export type StudentChildrenForm = z.infer<typeof studentChildrenSchema>;
export type ChildForm = z.infer<typeof childSchema>;
export type StudentWorkSituationForm = z.infer<typeof studentWorkSituationSchema>;
export type EmergencyContactForm = z.infer<typeof emergencyContactSchema>;
export type StudentHealthDataForm = z.infer<typeof studentHealthDataSchema>;
export type StudentAnnotationForm = z.infer<typeof studentAnnotationSchema>;