

## Plano: Corrigir erro de duplicata e alinhar checkboxes

### Problema 1: Erro de duplicata (23505)
O `markAsAdministered` tenta fazer `INSERT` mas já existe um registro no banco para a mesma combinação `(schedule_id, data_agendada, horario_agendado)` — provavelmente criado pela administração em lote. O problema está em que após o bulk, o estado local pode não estar atualizado, e o `item.log_id` fica `undefined`, fazendo o código tentar INSERT ao invés de UPDATE.

**Correção em `src/hooks/use-medication-administration.ts`**: Na função `markAsAdministered`, usar `upsert` com `onConflict: 'schedule_id, data_agendada, horario_agendado'` no caso de INSERT, em vez de `insert` simples. Isso garante que se o log já existir, ele será atualizado ao invés de falhar.

### Problema 2: Alinhamento dos checkboxes
A div que contém o checkbox usa `items-center`, alinhando verticalmente ao centro. O `MedicationItem` pode ter altura variável (nome, dosagem, instruções), fazendo o checkbox ficar desalinhado.

**Correção em `src/components/medications/MedicationTimeGroup.tsx`**: Trocar `items-center` por `items-start` na linha 165 e adicionar `pt-3` ao container do checkbox para alinhar com o nome do aluno.

### Resumo de alterações
- **`use-medication-administration.ts`**: `markAsAdministered` — trocar `.insert(...)` por `.upsert(..., { onConflict: '...' })`
- **`MedicationTimeGroup.tsx`**: Linha 165 — `items-center` → `items-start`, adicionar padding-top ao checkbox

