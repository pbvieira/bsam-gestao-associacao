

## Plano: Corrigir refetch após administrar medicamento

### Problema
Após clicar em "Administrar" e confirmar, o dado é salvo no banco mas a tela não reflete a mudança. O problema tem duas causas:

1. **`fetchMedications()` é chamado sem `await`** nas funções `markAsAdministered`, `markAsNotAdministered`, `undoAdministration` e `bulkMarkAsAdministered`. O `await` no `handleConfirmAdminister` resolve ANTES do refetch completar. O dialog fecha e causa re-render com dados antigos. O refetch completa depois mas pode ter seu resultado sobrescrito.

2. **`data_agendada` usa `format(date, 'yyyy-MM-dd')` ao invés de `item.data_agendada`** em `markAsAdministered` e `markAsNotAdministered`. Em cenários de timezone edge-case, isso pode escrever uma data diferente da que o fetch procura.

### Correção

**`src/hooks/use-medication-administration.ts`**:

- Adicionar `await` antes de todas as chamadas `fetchMedications()` nas 4 funções de mutação (linhas 345, 396, 415, 469)
- Em `markAsAdministered`: usar `item.data_agendada || format(date, 'yyyy-MM-dd')` no lugar de `format(date, 'yyyy-MM-dd')` (linha 308/333)
- Em `markAsNotAdministered`: mesma correção (usar `item.data_agendada`)

Isso garante que a UI só atualiza APÓS o refetch completar com os dados corretos do banco.

