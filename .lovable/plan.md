

## Plano: Adicionar controle de convivência e pensão na aba Filhos

### Contexto atual
A tabela `student_children` já possui o campo `convive_filhos` (boolean). Faltam os campos para controlar se paga pensão e o valor. A aba atual (`student-children-tab.tsx`) só exibe a lista de filhos, sem os campos de convivência/pensão.

### Alterações necessárias

#### 1. Migração SQL
Adicionar dois campos na tabela `student_children`:
- `paga_pensao` (boolean, default false, nullable)
- `valor_pensao` (numeric, nullable)

```sql
ALTER TABLE public.student_children
ADD COLUMN paga_pensao boolean DEFAULT false,
ADD COLUMN valor_pensao numeric;
```

#### 2. Hook `use-student-children.ts`
- Expor o estado do registro `student_children` (convive_filhos, paga_pensao, valor_pensao) como `childrenInfo`
- Adicionar função `updateChildrenInfo` para atualizar esses campos na tabela `student_children`
- Armazenar os dados do registro pai no state para uso no componente

#### 3. Componente `student-children-tab.tsx`
Adicionar acima da lista de filhos um card/seção com:
- Switch/Radio "Convive com os filhos?" (Sim/Não) -- usa o campo `convive_filhos` já existente
- Quando `convive_filhos = false`, exibir:
  - Switch "Paga pensão?" (Sim/Não)
  - Quando `paga_pensao = true`, exibir campo numérico "Valor da pensão (R$)"
- Salvamento automático ao alterar cada campo (ou botão salvar, seguindo padrão do sistema)

#### 4. Schema `student-schemas.ts`
Atualizar `studentChildrenSchema` para incluir os novos campos:
```ts
export const studentChildrenSchema = z.object({
  tem_filhos: z.boolean().default(false),
  quantidade_filhos: z.number().default(0),
  convive_filhos: z.boolean().default(false),
  paga_pensao: z.boolean().default(false),
  valor_pensao: z.number().nullish(),
});
```

### Resumo de arquivos
| Arquivo | Ação |
|---------|------|
| Migração SQL | Adicionar `paga_pensao` e `valor_pensao` |
| `src/hooks/use-student-children.ts` | Expor e atualizar `childrenInfo` |
| `src/components/students/tabs/student-children-tab.tsx` | UI para convivência e pensão |
| `src/lib/student-schemas.ts` | Atualizar schema |

