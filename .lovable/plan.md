
# Controle de Pendências (Kanban) para Coordenadores

Módulo novo, estilo Trello: quadros com colunas configuráveis, cards arrastáveis, comentários, anexos, dependências entre setores e relatórios. Acesso para Coordenadores, Diretores e Administradores; demais papéis só veem o que criam ou onde são responsáveis.

## 1. Campos do card (com sugestões de melhoria)

Campos pedidos:
- **Demanda** (título curto + descrição rica)
- **Solicitante** (usuário do sistema)
- **Data da solicitação** (auto)
- **Status de aceite**: Pendente / Aceita / Rejeitada
- **Data de aceite/rejeição** (auto ao mudar status)
- **Motivo da rejeição** (obrigatório se rejeitada)
- **Dependência externa**: setor bloqueador + responsável pelo travamento + descrição
- **Responsável pela execução**
- **Data de entrega** (real, preenchida ao concluir)

Campos sugeridos a adicionar:
- **Prazo (due date)** — data prometida, separada da entrega real, para medir SLA
- **Prioridade** (Baixa / Média / Alta / Urgente) com cor
- **Área e Setor** (reaproveita tabelas `areas` / `setores` já existentes)
- **Categoria/Tipo de demanda** (tabela auxiliar configurável: Operacional, Financeiro, RH, etc.)
- **Estimativa de esforço** (horas ou pontos) — opcional
- **Etiquetas/Tags** livres (multi) com cor
- **Checklist** de subtarefas com % concluído
- **Comentários** (timeline com autor e data)
- **Anexos** (Supabase Storage)
- **Histórico de movimentação** (log automático: criação, mudança de coluna, mudança de responsável, aceite, rejeição, conclusão)
- **Vincular a aluno / tarefa / evento** (opcional, para rastreabilidade cruzada)
- **Bloqueado?** flag derivada da dependência externa, exibida com ícone vermelho no card

## 2. Quadro padrão sugerido

Criado automaticamente na primeira vez que o módulo é aberto, chamado **"Pendências dos Coordenadores"**, com colunas:

```text
[Backlog] → [Em Análise] → [Aceita] → [Em Execução] → [Bloqueada] → [Concluída] → [Rejeitada]
```

- **Backlog**: recém criada, aguardando triagem
- **Em Análise**: coordenador avaliando aceite
- **Aceita**: aprovada, aguardando alocação
- **Em Execução**: responsável trabalhando
- **Bloqueada**: dependência externa ativa (entra aqui automaticamente quando o campo de dependência é preenchido)
- **Concluída**: entregue (coluna final verde, marca data_entrega)
- **Rejeitada**: encerrada negativamente (coluna final vermelha, exige motivo)

Cada coluna tem: nome, cor, posição, limite opcional de cards (WIP limit) e flag `is_final` para colunas que encerram o ciclo.

## 3. Interface Kanban

- Página `/pendencias` com seletor de quadro no topo (dropdown) + botão "Novo Quadro".
- Layout horizontal scrollável com colunas; cada coluna mostra contador e (se houver) limite WIP.
- Cards exibem: título, prioridade (barra colorida), responsável (avatar), prazo (badge vermelho se atrasado), ícones de comentário/anexo/bloqueio.
- **Drag-and-drop** entre colunas e reordenação dentro da coluna usando `@dnd-kit/core` + `@dnd-kit/sortable` (já compatível com React 18 e acessível).
- Clique no card abre um **Dialog** com abas: Detalhes, Checklist, Comentários, Anexos, Histórico.
- Filtros no topo: responsável, solicitante, prioridade, etiqueta, prazo, texto livre.
- Modo de visualização extra: **Lista/Tabela** (mesmos dados, útil para ver tudo de uma vez) e **Minhas Pendências** (atalho que filtra responsável = eu).
- Configuração do quadro (engrenagem): editar nome, gerenciar colunas (criar, renomear, reordenar via drag, definir cor/WIP/final, excluir só se vazia).

## 4. Localização no sidebar

Criar **novo grupo** "Gestão" entre "Calendário" e "Alunos", com ícone `Kanban` (lucide):

```text
Gestão
 └─ Pendências        /pendencias        módulo: pendencies
 └─ Meus Quadros      /pendencias/meus   (atalho filtrado)
```

Justificativa: é uma ferramenta de coordenação transversal, não cabe em "Principal" (que é dashboard pessoal) nem em "Administração".

Visibilidade extra: badge vermelho no item "Pendências" com contagem de cards onde o usuário é responsável **e** estão atrasados — alta visibilidade sem ser intrusivo.

## 5. Controle de acesso

Novo módulo `pendencies` em `role_module_access` + capabilities granulares:

| Capability               | Diretor | Coordenador | Auxiliar | Aluno |
| ------------------------ | :-----: | :---------: | :------: | :---: |
| pendencies.read          |    ✓    |      ✓      |    ✓*    |   ✓*  |
| pendencies.create        |    ✓    |      ✓      |    ✓     |   ✓   |
| pendencies.update_own    |    ✓    |      ✓      |    ✓     |   ✓   |
| pendencies.manage_boards |    ✓    |      ✓      |    -     |   -   |
| pendencies.assign        |    ✓    |      ✓      |    -     |   -   |
| pendencies.accept_reject |    ✓    |      ✓      |    -     |   -   |
| pendencies.delete        |    ✓    |      -      |    -     |   -   |

*Auxiliar/Aluno só veem cards onde são solicitante OU responsável (filtrado por RLS). Coordenador/Diretor/Admin veem o quadro inteiro.

## 6. Modelo de dados (resumo técnico)

Tabelas novas no schema `public` (todas com `GRANT` correto, RLS habilitada e triggers de `updated_at`):

- **pendency_boards** — id, nome, descricao, cor, created_by, is_default, ativo
- **pendency_columns** — id, board_id, nome, cor, posicao, wip_limit, is_final, kind ('open'|'done'|'rejected'|'blocked')
- **pendencies** — id, board_id, column_id, posicao, titulo, descricao, solicitante_id, responsavel_id, area_id, setor_id, categoria_id, prioridade, status_aceite ('pendente'|'aceita'|'rejeitada'), data_aceite, motivo_rejeicao, prazo, data_entrega, dep_setor_id, dep_responsavel_id, dep_descricao, esforco_estimado, created_by, created_at, updated_at
- **pendency_tags** — id, board_id, nome, cor
- **pendency_tag_links** — pendency_id, tag_id
- **pendency_checklist_items** — id, pendency_id, texto, concluido, posicao
- **pendency_comments** — id, pendency_id, autor_id, texto, created_at
- **pendency_attachments** — id, pendency_id, nome, storage_path, mime, tamanho, uploaded_by
- **pendency_activity_log** — id, pendency_id, autor_id, acao, payload jsonb, created_at
- **pendency_categories** — id, nome, cor, ativo (tabela auxiliar gerenciável em Configurações)

Bucket de Storage: `pendency-attachments` (privado, RLS por board).

RLS:
- Boards/colunas: leitura para qualquer usuário com `pendencies.read`; escrita exige `pendencies.manage_boards`.
- Pendencies: SELECT permitido se `is_coordinator_or_above()` OU solicitante=auth.uid() OU responsavel=auth.uid(); UPDATE/DELETE controlados por capabilities + propriedade.

Triggers:
- Ao mudar `column_id` → insere em `pendency_activity_log`.
- Ao mudar `status_aceite` para 'aceita'/'rejeitada' → preenche `data_aceite`; se 'rejeitada' exige motivo (CHECK + trigger).
- Ao entrar em coluna `kind='done'` → preenche `data_entrega = now()`.
- Ao preencher `dep_setor_id` → move automaticamente para coluna `kind='blocked'` (se existir).
- Notificação para responsável e solicitante em eventos relevantes (reaproveita `notifications`).

## 7. Notificações

Reusa o sistema existente (`notifications`) com novos tipos:
- `pendency_assigned`, `pendency_accepted`, `pendency_rejected`, `pendency_blocked`, `pendency_due_soon` (24h), `pendency_overdue`, `pendency_completed`, `pendency_commented`.

Cada usuário pode silenciar tipos em `notification_settings`.

## 8. Relatórios

Nova aba **"Pendências"** em `/relatorios` com:
- **Visão geral**: cards de total aberto, atrasadas, bloqueadas, concluídas no período, taxa de aceite, tempo médio de ciclo (criação → conclusão), tempo médio em cada coluna.
- **Por responsável**: ranking de cargas atuais e entregas no período (gráfico de barras).
- **Por setor/área**: distribuição e tempo médio de bloqueio quando setor é "travador".
- **Por categoria**: pizza com tipos de demanda.
- **Cumulative Flow Diagram**: quantidade de cards por coluna ao longo do tempo.
- **Tempo de bloqueio**: top dependências externas que mais travam o fluxo.
- Filtros: período, quadro, responsável, prioridade, categoria.
- Exportação CSV/PDF (reaproveita padrão de relatórios existente).

## 9. Plano de implementação por fases

**Fase 1 — Base de dados e backend**
- Migrações com tabelas, GRANTs, RLS, triggers, função `is_coordinator_or_above()`, seed do quadro padrão e categorias iniciais.
- Bucket de storage + policies.
- Capabilities e módulo `pendencies` em `role_capabilities` / `role_module_access` para os 5 papéis.

**Fase 2 — Hooks e tipos**
- `use-pendency-boards.ts`, `use-pendency-columns.ts`, `use-pendencies.ts`, `use-pendency-comments.ts`, `use-pendency-attachments.ts`, `use-pendency-activity.ts`, `use-pendency-categories.ts`.

**Fase 3 — Kanban UI**
- Página `/pendencias` (`src/pages/Pendencies.tsx`) com `MainLayout`.
- Componentes em `src/components/pendencies/`:
  - `board-selector.tsx`, `board-settings-dialog.tsx`
  - `kanban-board.tsx` (drag-and-drop com `@dnd-kit`)
  - `kanban-column.tsx`, `pendency-card.tsx`
  - `pendency-dialog.tsx` (abas Detalhes/Checklist/Comentários/Anexos/Histórico)
  - `pendency-filters.tsx`, `pendency-list-view.tsx`
- Instalar dependência: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.

**Fase 4 — Navegação e acesso**
- Adicionar grupo "Gestão" em `src/components/navigation/sidebar.tsx` com badge de pendências atrasadas.
- Rota em `src/App.tsx` protegida por `UnifiedRoute module="pendencies"`.
- Atalho "Meus Quadros" `/pendencias?escopo=meus`.

**Fase 5 — Notificações**
- Triggers SQL inserindo em `notifications` para eventos do card.
- Atualizar `notification-settings.tsx` para incluir novos tipos.

**Fase 6 — Relatórios**
- Nova aba/seção em `src/components/reports/` (`pendencies-report.tsx`) com gráficos via `recharts` (já no projeto).
- Integrar em `src/pages/Reports.tsx`.

**Fase 7 — Configurações auxiliares**
- Página `/categorias-pendencias` para gerenciar `pendency_categories` (padrão das tabelas auxiliares existentes).
- Atalho em `/configuracoes`.

## 10. Fora do escopo desta entrega
- Integração com e-mail externo (só notificações internas).
- Automações tipo "se card ficar X dias na coluna Y, mover para Z" (pode vir depois).
- Templates de quadros pré-prontos além do padrão.
- Aplicativo mobile dedicado (a UI será responsiva, mas o foco é desktop).
