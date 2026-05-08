/**
 * Catálogo central de capabilities do sistema.
 *
 * Reflete o conteúdo da tabela `role_capabilities` e é usado pela tela de
 * Gestão de Permissões para renderizar a matriz agrupada e amigável.
 *
 * Para adicionar uma nova capability:
 *  1. Inserir no banco (role_capabilities) — usar migration.
 *  2. Adicionar a entrada abaixo no grupo apropriado.
 *  3. Atualizar RLS / edge functions / frontend para checá-la.
 */

export interface CapabilityDefinition {
  /** Chave técnica usada em RLS, RPC has_capability e frontend */
  key: string;
  /** Rótulo curto para exibição na UI */
  label: string;
  /** Descrição exibida em tooltip / linha auxiliar */
  description: string;
  /** Marca capabilities sensíveis (system.admin, users.manage etc.) */
  sensitive?: boolean;
}

export interface CapabilityGroup {
  /** Identificador estável do grupo (usado como key React e estado de colapso) */
  id: string;
  /** Rótulo do grupo */
  label: string;
  /** Descrição opcional do domínio */
  description?: string;
  /** Ícone lucide-react opcional (apenas o nome) */
  icon?: string;
  /** Lista de capabilities do grupo */
  capabilities: CapabilityDefinition[];
}

export const CAPABILITY_GROUPS: CapabilityGroup[] = [
  {
    id: "students",
    label: "Alunos",
    description: "Cadastro, ficha e operações sobre alunos",
    icon: "Users",
    capabilities: [
      {
        key: "students.read",
        label: "Visualizar alunos",
        description: "Listar e abrir fichas de alunos",
      },
      {
        key: "students.write",
        label: "Editar alunos",
        description: "Criar e atualizar dados cadastrais, anotações, contatos, situação de trabalho etc.",
      },
      {
        key: "students.delete",
        label: "Excluir alunos",
        description: "Remover cadastros de alunos (operação irreversível)",
        sensitive: true,
      },
    ],
  },
  {
    id: "students-health",
    label: "Saúde do aluno",
    description: "Prontuário, medicamentos, vacinas, consultas e dados clínicos",
    icon: "Stethoscope",
    capabilities: [
      {
        key: "students.health.read",
        label: "Visualizar dados de saúde",
        description: "Acessar prontuário, vacinas, doenças, deficiências, internações e logs",
      },
      {
        key: "students.health.write",
        label: "Editar dados de saúde",
        description: "Cadastrar e alterar prontuário, vacinas, doenças, consultas e medicamentos",
      },
      {
        key: "medications.administer",
        label: "Administrar medicamentos",
        description: "Registrar administração no painel de medicamentos (auditoria)",
      },
    ],
  },
  {
    id: "students-financial",
    label: "Financeiro do aluno",
    description: "Livro caixa, benefícios e renda do aluno",
    icon: "Wallet",
    capabilities: [
      {
        key: "students.financial.read",
        label: "Visualizar financeiro",
        description: "Consultar livro caixa, benefícios e rendas dos alunos",
      },
      {
        key: "students.financial.write",
        label: "Editar financeiro",
        description: "Lançar e editar livro caixa, benefícios e rendas dos alunos",
      },
    ],
  },
  {
    id: "calendar",
    label: "Calendário",
    description: "Eventos, convites e participantes",
    icon: "Calendar",
    capabilities: [
      {
        key: "calendar.read",
        label: "Acesso ao calendário",
        description: "Acessar a página do calendário (vê apenas eventos próprios e convites recebidos)",
      },
      {
        key: "calendar.write",
        label: "Criar eventos",
        description: "Criar novos eventos e convidar participantes",
      },
      {
        key: "calendar.read.all",
        label: "Visualizar todos os eventos",
        description: "Ver eventos criados por qualquer usuário, mesmo sem ser participante",
      },
      {
        key: "calendar.manage.all",
        label: "Controle total do calendário",
        description: "Editar, cancelar e gerenciar participantes de qualquer evento",
      },
    ],
  },
  {
    id: "tasks",
    label: "Tarefas",
    description: "Quadro e atribuição de tarefas",
    icon: "CheckSquare",
    capabilities: [
      {
        key: "tasks.read",
        label: "Visualizar tarefas",
        description: "Listar e consultar tarefas",
      },
      {
        key: "tasks.write",
        label: "Editar tarefas",
        description: "Criar, atribuir e atualizar tarefas",
      },
      {
        key: "tasks.delete",
        label: "Excluir tarefas",
        description: "Remover tarefas",
        sensitive: true,
      },
    ],
  },
  {
    id: "inventory",
    label: "Inventário",
    description: "Itens, estoque e movimentações",
    icon: "Package",
    capabilities: [
      {
        key: "inventory.read",
        label: "Visualizar inventário",
        description: "Consultar itens, estoque e movimentações",
      },
      {
        key: "inventory.write",
        label: "Movimentar estoque",
        description: "Registrar entradas e saídas de inventário",
      },
      {
        key: "inventory.manage",
        label: "Gerenciar inventário",
        description: "Criar e editar itens, categorias e configurações de estoque",
      },
    ],
  },
  {
    id: "purchases",
    label: "Compras",
    description: "Pedidos de compra e aprovações",
    icon: "ShoppingCart",
    capabilities: [
      {
        key: "purchases.read",
        label: "Visualizar pedidos",
        description: "Consultar pedidos de compra",
      },
      {
        key: "purchases.write",
        label: "Criar pedidos",
        description: "Abrir e editar pedidos de compra próprios (status pendente)",
      },
      {
        key: "purchases.approve",
        label: "Aprovar / receber",
        description: "Aprovar pedidos, registrar recebimento e gerenciar pedidos de outros usuários",
        sensitive: true,
      },
    ],
  },
  {
    id: "suppliers",
    label: "Fornecedores",
    icon: "Truck",
    capabilities: [
      {
        key: "suppliers.read",
        label: "Visualizar fornecedores",
        description: "Consultar cadastro de fornecedores",
      },
      {
        key: "suppliers.manage",
        label: "Gerenciar fornecedores",
        description: "Criar, editar e remover fornecedores",
      },
    ],
  },
  {
    id: "reports",
    label: "Relatórios",
    icon: "BarChart3",
    capabilities: [
      {
        key: "reports.read",
        label: "Visualizar relatórios",
        description: "Acessar dashboards e relatórios analíticos",
      },
    ],
  },
  {
    id: "documents",
    label: "Documentos",
    description: "Modelos de documentos legais",
    icon: "FileText",
    capabilities: [
      {
        key: "documents.templates.manage",
        label: "Gerenciar modelos",
        description: "Criar e editar modelos de documentos legais (declarações, autorizações etc.)",
      },
    ],
  },
  {
    id: "aux-tables",
    label: "Tabelas auxiliares",
    description: "Áreas, setores, categorias e demais parametrizações",
    icon: "Settings2",
    capabilities: [
      {
        key: "aux_tables.manage",
        label: "Gerenciar tabelas auxiliares",
        description: "Editar áreas, setores, categorias, status, tipos de benefício/renda/uso etc.",
      },
    ],
  },
  {
    id: "system-settings",
    label: "Configurações do sistema",
    description: "Parâmetros globais da aplicação (capacidade de alunos etc.)",
    icon: "Settings",
    capabilities: [
      {
        key: "system_settings.read",
        label: "Visualizar configurações",
        description: "Acessar a tela de Configurações Gerais e ler parâmetros globais",
      },
      {
        key: "system_settings.write",
        label: "Editar configurações",
        description: "Alterar parâmetros globais do sistema (ex.: capacidade de vagas)",
      },
    ],
  },
  {
    id: "system",
    label: "Sistema e administração",
    description: "Permissões críticas — conceder com cautela",
    icon: "ShieldAlert",
    capabilities: [
      {
        key: "users.manage",
        label: "Gerenciar usuários",
        description: "Criar, editar, ativar e excluir usuários do sistema",
        sensitive: true,
      },
      {
        key: "roles.manage",
        label: "Gerenciar funções",
        description: "Criar funções, ajustar permissões e acesso a módulos",
        sensitive: true,
      },
      {
        key: "system.admin",
        label: "Administrador do sistema",
        description: "Acesso administrativo total. Pelo menos um papel deve manter esta capability.",
        sensitive: true,
      },
    ],
  },
];

/** Lista plana de todas as capabilities conhecidas */
export const ALL_CAPABILITIES: CapabilityDefinition[] = CAPABILITY_GROUPS.flatMap(
  (g) => g.capabilities
);

/** Conjunto com as keys conhecidas — útil para detectar capabilities órfãs no banco */
export const KNOWN_CAPABILITY_KEYS = new Set(ALL_CAPABILITIES.map((c) => c.key));

/** Lookup rápido por key */
export const CAPABILITY_BY_KEY: Record<string, CapabilityDefinition> = Object.fromEntries(
  ALL_CAPABILITIES.map((c) => [c.key, c])
);

/** Resolve grupo de uma capability (fallback: grupo "Outros" implícito) */
export function getCapabilityGroupId(key: string): string | null {
  for (const g of CAPABILITY_GROUPS) {
    if (g.capabilities.some((c) => c.key === key)) return g.id;
  }
  return null;
}

/** Label amigável (ou a própria key se desconhecida) */
export function capabilityLabel(key: string): string {
  return CAPABILITY_BY_KEY[key]?.label ?? key;
}
