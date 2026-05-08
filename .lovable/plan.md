## Objetivo

O card de tarefas na visualização em lista (`/tarefas`) está ocupando muito espaço vertical. Vou refatorá-lo para ficar mais denso e fácil de escanear, mantendo todas as informações e ações.

## Problema atual

O card ocupa ~5 linhas verticais com muito padding:
1. Título + badge prioridade
2. Badges status + categoria
3. Descrição (até 2 linhas)
4. Linha do responsável
5. Linha da data de vencimento
6. Border-top + linha de botões com texto ("Iniciar", "Concluir", "Cancelar")

Padding de `p-4` + `space-y-3` + `pt-2 border-t` adiciona ~32px de espaço vertical desnecessário.

## Mudanças no `src/components/tasks/task-card.tsx`

**Layout em uma única linha horizontal compacta** (variante `list`):

```text
[●prio] Título da tarefa            [status] [cat]  👤 Responsável  🕐 vence em 2d   [▶][✓][✕] [✏][🗑]
        descrição em 1 linha truncada...
```

Detalhes:
- Reduzir padding: `p-4` → `px-3 py-2.5`
- Remover `space-y-3` — usar flex horizontal
- Título e descrição em uma coluna flexível (descrição em `line-clamp-1` + `text-xs`)
- Badges de prioridade e status menores (`text-xs px-2 py-0`)
- Responsável e data inline em `text-xs` lado a lado (não mais em linhas separadas)
- Remover o `border-t` separador — ações ficam na mesma linha à direita
- Botões de ação em modo ícone apenas (`h-7 w-7 p-0`) com `tooltip` via `title=`:
  - Iniciar (ArrowRight), Concluir (Check), Cancelar (X), Editar (Edit), Excluir (Trash2)
- Remover totalmente o branch `isBoard` do componente (a board view já foi removida do projeto, conforme memória `task-management-ui-modes`). Simplifica o código.
- Remover prop `variant`.

Resultado: cada card passa de ~140px para ~64px de altura, permitindo ver muito mais tarefas de uma vez.

## Detalhes técnicos

- Manter toda a lógica de permissões (`canEditTask`, `canDeleteTask`), handlers (`handleStatusChange`, `handleDelete`) e o `AlertDialog` de exclusão sem alterações.
- O `TaskCard` é usado apenas em `src/components/tasks/task-list.tsx` no modo `list` — sem outros consumidores que dependam de `variant="board"`.
- Usar `flex items-center gap-3` no container principal para alinhamento horizontal limpo.
- Preservar destaque visual de prioridade com uma barra lateral colorida (`border-l-4`) em vez do badge ocupar espaço — mais escaneável.
