
# Dashboard com filtros funcionais

## Problema atual
- O filtro só tem 3 opções fixas (Hoje / Esta Semana / Este Mês) ancoradas em "hoje".
- Quando o mês vira, eventos/tarefas do mês anterior somem.
- Não há como ver itens passados, futuros próximos, nem alternar entre "minhas" e "de toda a equipe".
- Sem indicação visual de quantos itens existem em cada período.

## Proposta de interface

### 1. Barra de filtros no topo do card "Minha Área de Trabalho"

```text
┌──────────────────────────────────────────────────────────────────┐
│ 📅 Minha Área de Trabalho                                        │
├──────────────────────────────────────────────────────────────────┤
│ Período: [Próximos 7 dias ▼]   Escopo: [Minhas ▼]   [⚙ Filtros] │
│ ─────────────────────────────────────────────────────────────── │
│ 📌 Mostrando: 23/maio → 29/maio · 5 tarefas · 2 eventos          │
└──────────────────────────────────────────────────────────────────┘
```

**Período** (select com presets + intervalo custom):
- Hoje
- Amanhã
- Próximos 7 dias *(padrão)*
- Próximos 30 dias
- Esta semana
- Este mês
- Mês passado
- Intervalo personalizado → abre date range picker

**Escopo** (select):
- Minhas (atribuídas a mim OU criadas por mim) *(padrão)*
- Que criei
- Atribuídas a mim
- Da equipe (somente admin/gestor)

**Filtros avançados** (popover):
- Tipo: ☑ Eventos ☑ Tarefas ☑ Saúde
- Prioridade: Alta / Média / Baixa
- Status: Pendente / Em andamento
- Setor (para admin/gestor)

### 2. Regra de visibilidade fixa
**Tarefas atrasadas e eventos do dia sempre aparecem**, independente do filtro de período — com aviso claro no topo. Isso garante que virar o mês nunca esconde compromissos críticos.

### 3. Resumo contextual
Linha de subtítulo mostra o intervalo ativo + contagens, para o usuário entender exatamente o que está vendo.

### 4. Persistência
Filtros escolhidos ficam salvos em `localStorage` por usuário, então ao voltar amanhã ele continua na mesma visão.

### 5. Estado vazio melhorado
Quando o filtro não retorna nada, mostrar:
- "Nada em [período]. Ver próximos 30 dias →" (link rápido para ampliar)

## Detalhes técnicos

- Novo componente `DashboardFilters` em `src/components/dashboard/dashboard-filters.tsx` com estado `{ period, scope, types, priorities, statuses }`.
- Hook `useDashboardFilters` encapsula presets, conversão para `{startDate, endDate}` e persistência em `localStorage` (`dashboard-filters-v1`).
- `WorkspaceArea` consome o hook em vez de manter `timeFilter` local; lógica de filtragem de tarefas/eventos passa a usar os novos campos.
- Date range picker custom usa o Shadcn `Calendar` (mode="range") dentro de `Popover` com `pointer-events-auto`.
- `HealthSummaryCards` continua respeitando o período (converte intervalo para o seu próprio cálculo).
- `WorkspaceHeader` ganha badge extra "X atrasadas" quando houver, em vermelho.

## Arquivos a alterar/criar
- **Novo** `src/components/dashboard/dashboard-filters.tsx`
- **Novo** `src/hooks/use-dashboard-filters.ts`
- **Editar** `src/components/dashboard/workspace-area.tsx` (substituir Tabs por DashboardFilters; atualizar lógica de filtragem)
- **Editar** `src/components/dashboard/workspace-header.tsx` (badge de atrasadas)
- **Editar** `src/hooks/use-dashboard-health-summary.ts` (aceitar `{start, end}` em vez de só `TimeFilter`)

## Fora do escopo
- Mudanças em permissões/RLS.
- Reorganização visual do card (cores, espaçamentos, animações) — só ajustes mínimos para acomodar os filtros.
