# Refatoração da aba "Filhos"

## Mudanças na UI (Situação Familiar)

1. Adicionar switch **"Tem contato com os filhos?"** logo abaixo de "Convive com os filhos?".
2. Tornar o switch **"Paga pensão?"** sempre visível (remover a condição `!convive_filhos`).
3. Campo "Valor da pensão (R$)" continua aparecendo apenas quando `paga_pensao = true`.

## Mudanças no diálogo Adicionar/Editar Filho

Adicionar novo campo **"Tipo de filiação"** (Select) com as opções:
- Filho legítimo
- Filho adotivo
- Filho socioafetivo

Campo opcional (sem validação obrigatória).

## Banco de dados (migration)

- `student_children`: adicionar coluna `tem_contato_filhos boolean default false`.
- `student_children_list`: adicionar coluna `tipo_filiacao text` (livre, valores: `legitimo` | `adotivo` | `socioafetivo`).

## Arquivos a alterar

- `supabase/migrations/...` — nova migration com as duas colunas.
- `src/hooks/use-student-children.ts` — incluir `tem_contato_filhos` no estado `ChildrenInfo`, no insert inicial, no fetch e no update; incluir `tipo_filiacao` na interface `Child` e nas operações de create/update.
- `src/lib/student-schemas.ts` — adicionar `tem_contato_filhos` em `studentChildrenSchema` e `tipo_filiacao` em `childSchema`.
- `src/components/students/tabs/student-children-tab.tsx` — novo switch, remover condicional do "Paga pensão".
- `src/components/students/tabs/child-dialog.tsx` — novo `Select` "Tipo de filiação" com as 3 opções.

## Memory

Atualizar `mem://features/student-children-family-situation-logic` com a nova regra (pensão sempre visível, contato com filhos, tipo de filiação por filho).
