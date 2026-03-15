

## Plano: Ajustar máscara do RG para 10 dígitos

O RG atual aceita 9 dígitos (`##.###.###-#`). O pedido é adicionar mais um dígito no corpo, mantendo o verificador com 1 dígito: `###.###.###-#` (10 dígitos total).

### Alteração

**`src/components/ui/masked-input.tsx`** — Atualizar a configuração `rg`:
- `pattern`: `'###.###.###-#'` (era `'##.###.###-#'`)
- `maxLength`: `13` (era `12`)
- `placeholder`: `'000.000.000-0'` (era `'00.000.000-0'`)
- `maxDigits`: `10` (era `9`)

