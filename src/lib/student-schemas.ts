import { z } from 'zod';

// Main student schema
export const studentHeaderSchema = z.object({
  numero_interno: z.string().nullish(),
  hora_entrada: z.string().nullish(),
  nome_completo: z.string().min(1, 'Nome completo é obrigatório').max(255),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  cpf: z.string().nullish(),
  rg: z.string().nullish(),
  nome_responsavel: z.string().nullish(),
  parentesco_responsavel: z.string().nullish(),
  data_abertura: z.string().nullish(),
  data_saida: z.string().nullish(),
});

// Basic data schema
export const studentBasicDataSchema = z.object({
  telefone: z.string().nullish(),
  endereco: z.string().nullish(),
  cep: z.string().nullish(),
  numero: z.string().nullish(),
  bairro: z.string().nullish(),
  cidade: z.string().nullish(),
  estado: z.string().nullish(),
  estado_civil: z.string().nullish(),
  religiao: z.string().nullish(),
  batizado: z.string().nullish(),
  pis_nis: z.string().nullish(),
  cartao_sus: z.string().nullish(),
  estado_nascimento: z.string().nullish(),
  cidade_nascimento: z.string().nullish(),
  situacao_moradia: z.string().nullish(),
  estuda: z.boolean().default(false),
  escolaridade: z.string().nullish(),
  nome_pai: z.string().nullish(),
  data_nascimento_pai: z.string().nullish(),
  estado_pai: z.string().nullish(),
  nome_mae: z.string().nullish(),
  data_nascimento_mae: z.string().nullish(),
  estado_mae: z.string().nullish(),
  nome_conjuge: z.string().nullish(),
  data_nascimento_conjuge: z.string().nullish(),
  estado_conjuge: z.string().nullish(),
  comarca_juridica: z.string().nullish(),
  ha_processos: z.boolean().default(false),
  observacoes_juridicas: z.string().nullish(),
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
  profissao: z.string().nullish(),
  situacao_trabalhista: z.string().nullish(),
  empresa: z.string().nullish(),
  funcao: z.string().nullish(),
  data_admissao: z.string().nullish(),
  contato_empresa: z.string().nullish(),
  tipo_renda: z.string().nullish(),
  valor_renda: z.number().nullish(),
});

// Emergency contacts schema
export const emergencyContactSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  parentesco: z.string().nullish(),
  endereco: z.string().nullish(),
  avisar_contato: z.boolean().default(true),
});

// Health data schema
export const studentHealthDataSchema = z.object({
  teste_covid: z.string().nullish(),
  resultado_covid: z.string().nullish(),
  data_teste_covid: z.string().nullish(),
  teste_ist: z.string().nullish(),
  resultado_ist: z.string().nullish(),
  data_teste_ist: z.string().nullish(),
  tem_deficiencia: z.boolean().default(false),
  tipo_deficiencia: z.string().nullish(),
  vacinacao_atualizada: z.boolean().default(false),
  tratamento_odontologico: z.boolean().default(false),
  observacoes_odontologicas: z.string().nullish(),
  historico_internacoes: z.string().nullish(),
  acompanhamento_psicologico: z.boolean().default(false),
  detalhes_acompanhamento: z.string().nullish(),
  tentativa_suicidio: z.boolean().default(false),
  historico_surtos: z.boolean().default(false),
  alucinacoes: z.boolean().default(false),
  uso_medicamentos: z.boolean().default(false),
  descricao_medicamentos: z.string().nullish(),
  tempo_uso_medicamentos: z.string().nullish(),
  modo_uso_medicamentos: z.string().nullish(),
  dependencia_quimica_familia: z.boolean().default(false),
  detalhes_dependencia_familia: z.string().nullish(),
  observacoes_gerais: z.string().nullish(),
});

// Annotation schema
export const studentAnnotationSchema = z.object({
  tipo: z.enum(['anotacao']),
  categoria: z.string().nullish(),
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
