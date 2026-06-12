## Objetivo

Tornar o prazo de arquivamento automático de pendências (hoje fixo em 30 dias) configurável via Configurações do Sistema.

## Mudanças

### 1. Banco (migration)

- Inserir nova chave em `system_settings`:
  - `pendency_auto_archive_days` = `'30'` (padrão), descrição: "Dias para arquivar automaticamente pendências concluídas ou rejeitadas".
- Atualizar as RPCs `get_board_pendencies` e `get_archived_pendencies` para ler esse valor dinamicamente:
  ```sql
  _days := COALESCE((SELECT value::int FROM public.system_settings WHERE key = 'pendency_auto_archive_days'), 30);
  ```
  e usar `now() - (_days || ' days')::interval` no lugar do literal `30 days`.

### 2. UI — `src/pages/SystemSettingsPage.tsx`

Adicionar um novo `Card` "Arquivamento de Pendências" com:
- Input numérico (min 1) para `pendency_auto_archive_days`.
- Texto explicativo: "Cartões nas colunas 'Concluída' e 'Rejeitada' são ocultados do quadro após este número de dias."
- Botão Salvar usando `updateSetting('pendency_auto_archive_days', value)`.

Refatorar o componente para tratar múltiplas configurações (estado por chave, salvar individualmente).

### 3. Hook — `src/hooks/use-system-settings.ts`

Adicionar helper `getPendencyAutoArchiveDays: () => parseInt(settings.pendency_auto_archive_days || '30', 10)`.

### 4. UI — opcional, informativo

Em `PendencyArchived.tsx`, no texto de cabeçalho/descrição, substituir "+30 dias" por o valor atual do setting via `useSystemSettings`.

## Fora do escopo

- Permissões: já controladas por `system_settings.read/write`.
- Não alteramos schema da tabela `pendencies` nem da `system_settings`.
