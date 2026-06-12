## Correção da Fase 3 — arquivamento automático "+30 dias"

### Problema
Hoje o quadro só esconde cards quando `arquivada_em IS NOT NULL`. A regra dos 30 dias só roda se alguém clicar no botão "Arquivar antigas". O plano original definia: *"some do quadro automaticamente"*.

### Solução: derivação na query (sem cron)
Criar uma RPC `get_board_pendencies(_board_id)` que devolve apenas pendências consideradas "ativas":

```text
arquivada_em IS NULL
AND NOT (
  (coluna.kind = 'done'     AND data_entrega < now() - interval '30 days')
  OR
  (coluna.kind = 'rejected' AND data_aceite  < now() - interval '30 days')
)
```

Vantagens:
- Card antigo desaparece do kanban/lista no momento exato em que cruza 30 dias, sem job.
- `arquivada_em` continua reservado para arquivamento manual e restauração explícita.
- Tela de Arquivados precisa mostrar os dois casos (manual + derivado).

### Mudanças

**Banco (1 migração)**
- `get_board_pendencies(_board_id uuid)` — devolve as colunas atuais de `pendencies` filtradas pela regra acima.
- `get_archived_pendencies(_board_id uuid)` — devolve pendências `arquivada_em IS NOT NULL` **OU** que cruzaram os 30 dias em done/rejected. Inclui um campo derivado `arquivamento_tipo` (`'manual'` | `'automatico'`) e `arquivado_efetivo_em` (coalesce de `arquivada_em` ou `data_entrega + 30d` / `data_aceite + 30d`) para ordenação/exibição.

**Hooks (`use-pendencies.ts`)**
- `usePendencies(boardId)` → chama a nova RPC em vez de `from("pendencies").select`.
- `useArchivedPendencies(boardId)` → chama a nova RPC; tipo de retorno ganha `arquivamento_tipo` e `arquivado_efetivo_em`.
- `useRestorePendency` permanece (já move para a primeira coluna `open` e zera datas — funciona tanto para manual quanto automático, pois zerar `data_entrega`/`data_aceite` remove o card da regra dos 30 dias).
- `useArchiveOldPendencies` deixa de fazer sentido como "ação do usuário" (a regra é automática). **Remover** o botão da coluna e o botão "Arquivar antigas (+30d)" da tela de Arquivados.

**UI**
- `PendencyArchived.tsx`: adicionar coluna "Tipo" (badge: "Automático" / "Manual") e usar `arquivado_efetivo_em` na coluna "Arquivada em". Remover botão "Arquivar antigas".
- `kanban-column.tsx`: remover o ícone de Archive do header das colunas done/rejected (não é mais necessário).
- Atualizar a RPC `get_pendency_boards_overview` para também aplicar a regra dos 30 dias nos contadores `total_concluidas_mes` (cards concluídos no mês mas já passaram 30 dias devem continuar contando se forem do mês corrente — checar) — na prática `total_concluidas_mes` já filtra `data_entrega >= date_trunc('month', now())`, então só os primeiros dias de cada mês podem ter cards do mês passado >30d. Não exige mudança.

### O que NÃO muda
- Schema da tabela `pendencies` (campos `arquivada_em`/`arquivada_por` permanecem para uso manual/restauração).
- Rotas, layout dos cards, filtros, visão lista.
- `archive_old_pendencies()` SQL — pode ficar como utilitário interno (usado por scripts/manutenção), mas sem exposição na UI.

### Resultado para o usuário
- Coluna "Concluída" não acumula histórico: cards saem sozinhos após 30 dias.
- Página "Arquivados" lista tudo (manual + automático) com indicação clara da origem.
- Nenhum botão extra, nenhuma ação obrigatória do usuário.