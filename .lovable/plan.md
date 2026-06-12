
# Pendências — escalabilidade ao longo do tempo

Três frentes implementadas em fases. Cada fase entrega valor isolado e pode ser validada antes da próxima.

---

## Fase 1 — Navegação de quadros (índice + arquivamento)

**Objetivo:** acabar com o `Select` único e permitir convivência saudável com dezenas de quadros.

### Mudanças de UX
- `/pendencias` passa a ser **página índice**: grade de cards de quadros mostrando nome, descrição, contadores (abertas, atrasadas, concluídas no mês), data do último movimento, estrela de favorito.
- Filtros no topo: busca por nome, filtro por área/setor, toggle "Mostrar arquivados".
- Botão "Novo quadro" na própria página.
- Cada card abre `/pendencias/:boardId` — a tela kanban atual vira essa rota, com botão "← Voltar" no topo.
- No menu de ações do card de quadro: **Configurar**, **Arquivar/Restaurar**, **Excluir** (apenas quadros não-default e vazios).

### Mudanças de dados
- `pendency_boards`: adicionar `arquivado_em timestamptz null`, `arquivado_por uuid null`, `area_id uuid null` (se ainda não existir referência), `favorito_by uuid[] default '{}'` (ou tabela auxiliar `pendency_board_favorites(board_id, user_id)` — preferida por escalar melhor).
- Hook `usePendencyBoards` aceita `{ includeArchived?: boolean }` e devolve as métricas agregadas em uma única chamada (view ou RPC `get_boards_overview`).

### Roteamento
- `src/pages/Pendencies.tsx` vira o índice.
- Nova rota `src/pages/PendencyBoard.tsx` recebe o kanban atual + dialogs.
- Atualizar `App.tsx` com `/pendencias/:boardId`.

---

## Fase 2 — Filtros e visão lista dentro do quadro

**Objetivo:** quadro com 50–100+ cards continua legível.

### Filtros (barra acima do kanban)
- **Responsável** (multi-select com avatares)
- **Prioridade** (chips: Baixa / Média / Alta / Urgente)
- **Prazo** (chips: Atrasadas / Hoje / Esta semana / Sem prazo)
- **Tag** (multi-select usando `pendency_tags`)
- **Busca** (já existe — mover para a barra)
- **Limpar filtros** (aparece quando há algum ativo)
- Estado dos filtros persistido em querystring (`?resp=...&pri=...`) para compartilhar link.

### Visão alternativa
- Toggle no topo: **Kanban | Lista**.
- Modo lista: tabela com colunas Título, Status (coluna atual com cor), Responsável, Prioridade, Prazo, Tag, Atualizada em. Ordenação por header. Mesmos filtros aplicam.
- Preferência salva por usuário em `localStorage`.

### Coluna "Concluído" colapsável
- Colunas com `kind = 'done'` ou `kind = 'rejected'` mostram por padrão os **últimos 10 cards** + link "ver mais N".
- Header da coluna ganha ícone de chevron para colapsar/expandir totalmente.

---

## Fase 3 — Ciclo de vida (arquivamento de cards)

**Objetivo:** quadro não acumula histórico infinito; nada é apagado.

### Política
- Card em coluna `done` ou `rejected` há mais de **30 dias** é considerado arquivado e some do quadro automaticamente.
- Critério: `data_entrega` (para done) ou `data_aceite` (para rejected) + 30 dias < `now()`.
- Card arquivado nunca é deletado — só não aparece no kanban/lista padrão.

### UI
- Aba/tela **"Arquivados"** acessível pelo botão de configurações do quadro ou por uma aba no topo.
- Lista pesquisável (mesmos filtros da Fase 2) com ações: **Restaurar** (move para coluna `open` padrão e zera o critério de arquivamento) e **Excluir permanentemente** (com AlertDialog).
- No topo da coluna `done`/`rejected` do quadro: botão "Arquivar concluídas agora" para forçar manualmente.

### Dados
- Adicionar `arquivada_em timestamptz null` em `pendencies`.
- Query do kanban filtra `arquivada_em IS NULL`.
- Função/trigger ou job (pg_cron, se disponível; senão, derivação na query) marca `arquivada_em = now()` quando `data_entrega/data_aceite < now() - interval '30 days'`. Implementação preferida: **derivação na query** (`WHERE arquivada_em IS NOT NULL OR data_entrega < now() - interval '30 days'`) para não depender de cron — o campo `arquivada_em` fica reservado para arquivamentos manuais e restaurações explícitas.

---

## Ordem sugerida de execução

1. **Fase 1** primeiro — resolve o problema mais imediato (navegação) e independe das outras.
2. **Fase 3** em seguida — limpa o ruído visual histórico antes de polir filtros.
3. **Fase 2** por último — filtros e visão lista são refinamento sobre uma base já saudável.

Cada fase termina com QA visual no preview antes de seguir.

---

## Detalhes técnicos (resumo)

- Migrations Supabase: 1 por fase (boards: arquivamento+favoritos+métricas RPC; pendencies: `arquivada_em`).
- Sem mudanças destrutivas em colunas existentes.
- Hooks novos: `useBoardsOverview`, `useArchivedPendencies`, `useArchiveBoard`, `useArchivePendency`, `useRestorePendency`.
- RLS: novas políticas seguem o padrão atual (criador/responsável/coordenação).
- Rotas: adicionar `/pendencias/:boardId` mantendo `/pendencias` como índice.

Confirma a ordem (1 → 3 → 2) ou prefere outra sequência?
