## Objetivo

Remover o campo "Aceite" duplicado da modal e usar **apenas as colunas do quadro** como fonte de verdade para o status (incluindo rejeição). Aproveitar para enxugar a aba Detalhes, que hoje está com muitos campos espremidos em 2 colunas, e garantir que o histórico registre todas as transições com nomes legíveis.

## Análise da usabilidade atual

Problemas identificados na modal de pendência:

1. **Duplicidade de status**: existe `status_aceite` (Pendente/Aceita/Rejeitada) e também colunas com `kind` equivalente (`open`/`done`/`rejected`/`blocked`). Isso confunde — o usuário pode mover para "Rejeitada" mas deixar o aceite como "Pendente", gerando estados inconsistentes.
2. **Motivo de rejeição perdido**: só aparece se o select estiver em "rejeitada". Se a rejeição passa a ser por coluna, precisamos pedir o motivo no momento de mover para uma coluna `kind=rejected`.
3. **Aba Detalhes densa**: 9 campos em grid 2×n + 2 blocos extras. Sem agrupamento visual claro.
4. **Histórico pobre**: mostra "moveu de coluna" sem dizer **para qual** coluna; IDs crus no payload. Para virar a única fonte de status, precisa ficar legível.
5. **`confirm()` nativo na exclusão** (regra do projeto manda `AlertDialog`).
6. Dependência externa (bloqueio) move automaticamente para coluna `blocked` via trigger, mas o usuário não tem feedback disso na UI.

## Plano

### 1. Banco — manter coluna como fonte única de status

- **Manter** as colunas `status_aceite`, `data_aceite`, `motivo_rejeicao` no banco (compatibilidade com relatório e dados já gravados), mas **derivá-las automaticamente** a partir da coluna via trigger `pendency_business_rules`:
  - Ao mover para coluna `kind=rejected` → setar `status_aceite='rejeitada'` e `data_aceite=now()` (exigir `motivo_rejeicao` informado).
  - Ao mover para `kind=open` vindo de `rejected` → voltar para `pendente`, limpar `data_aceite` e `motivo_rejeicao`.
  - Ao mover para `kind=done`/`open`/`blocked` (não-rejected) e `status_aceite='pendente'` → setar `aceita` + `data_aceite=now()` (aceite implícito quando entra em execução).
- **Melhorar `pendency_log_changes`** para gravar no payload os **nomes** das colunas origem/destino (`from_name`, `to_name`) além dos IDs, facilitando a renderização do histórico sem joins extras.

### 2. Hook `use-pendencies.ts`

- Adicionar mutation auxiliar `useMovePendency({ id, column_id, motivo_rejeicao? })` que valida: se a coluna alvo é `kind=rejected`, exige `motivo_rejeicao`. Caso contrário, passa pela `useUpdatePendency` normal.
- Atualizar tipos do payload de `PendencyActivity` para incluir `from_name`/`to_name` opcionais.

### 3. Modal `pendency-dialog.tsx` — remover Aceite, reorganizar

- **Remover o bloco "Aceite"** inteiro (linhas 186–210).
- **Substituir o select "Coluna"** por uma trilha visual de status (chips clicáveis com a cor da coluna), mostrando claramente em que etapa está. Clicar em um chip dispara `useMovePendency`. Se o destino for `kind=rejected`, abrir um sub-dialog pedindo o motivo (obrigatório) antes de confirmar.
- **Reorganizar Detalhes em seções visuais** com separadores e títulos:
  - *Demanda*: Título, Descrição, Prioridade, Prazo.
  - *Responsabilidades*: Solicitante, Responsável, Área, Setor, Categoria.
  - *Bloqueio externo* (collapsible, fechado por padrão se vazio): Setor bloqueador, Responsável pelo bloqueio, Motivo. Mostrar aviso "Esta pendência será movida para a coluna Bloqueada automaticamente" quando preenchido.
  - *Status atual* (somente leitura, no topo): chip da coluna atual + data de aceite + data de entrega quando houver, + motivo da rejeição quando aplicável.
- **Trocar `confirm()` por `AlertDialog`** na exclusão (regra de projeto).
- Largura da modal de `max-w-3xl` para `max-w-4xl` para acomodar a trilha de status sem espremer.

### 4. Histórico legível

- Atualizar `HistoryTab` para usar os novos campos `from_name`/`to_name` do payload e renderizar frases completas:
  - "moveu de **Em Análise** para **Concluída**"
  - "rejeitou — motivo: *...*"
  - "aceitou (implícito ao entrar em Em Execução)"
- Adicionar ícone por tipo de ação (move, assign, accept, reject, complete, create) para varredura rápida.

### 5. Card do Kanban

- Remover badge "Rejeitada" baseada em `status_aceite` (a coluna já comunica isso). Manter apenas badges de bloqueio e atraso.

### 6. Relatório de Pendências

- Manter os filtros por `status_aceite` (dados continuam consistentes via trigger). Sem mudança funcional necessária, apenas validar que o filtro continua funcionando após a migração.

## Arquivos afetados

- `supabase/migrations/<nova>.sql` — atualizar funções `pendency_business_rules` e `pendency_log_changes`.
- `src/hooks/use-pendencies.ts` — nova mutation `useMovePendency`, tipos do log.
- `src/components/pendencies/pendency-dialog.tsx` — remover bloco Aceite, reorganizar seções, trilha de status, AlertDialog de exclusão, sub-dialog de motivo de rejeição.
- `src/components/pendencies/pendency-card.tsx` — remover badge "Rejeitada".
- (sem mudança) `src/components/reports/pendencies-report.tsx`.

## Pontos de atenção

- **Dados existentes**: pendências já criadas mantêm `status_aceite` atual; o trigger só age em transições futuras.
- **Permissões**: mover para `rejected` deve respeitar quem pode editar a pendência (RLS atual já cobre).
- O campo "Status atual" no topo da modal substitui a função do antigo select de Aceite — usuário continua vendo tudo que precisa sem campo redundante.
