

## Plano: Converter seções Vacinas, Doenças e Deficiências para formato de tabela compacta

### Problema
As três seções (Vacinas, Doenças, Deficiências) na aba Saúde usam cards individuais com bordas e padding para cada item, ocupando muito espaço vertical.

### Solução
Substituir o layout atual de "cards empilhados" por tabelas HTML compactas (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`) usando os componentes `ui/table.tsx` já existentes no projeto.

### Mudanças por arquivo

**1. `src/components/students/tabs/student-vaccines-section.tsx`**
- Substituir o `div` com `space-y-3` por uma `Table` com colunas: **Vacina** (com cor e tooltip), **Status** (Select), **Data** (Input date, visível só quando "Sim")
- Reduzir padding das células para layout mais compacto
- Manter os badges de estatísticas no header do Card
- Mover estatísticas do rodapé para o header (como já fazem Doenças e Deficiências)

**2. `src/components/students/tabs/student-diseases-section.tsx`**
- Substituir os `div` com `rounded-lg border p-3` por linhas de tabela com colunas: **Doença** (com cor e tooltip), **Status** (Select)
- Manter badges de estatísticas no header

**3. `src/components/students/tabs/student-disabilities-section.tsx`**
- Mesmo padrão: tabela com colunas **Deficiência** (com cor e tooltip), **Status** (Select)
- Manter badges de estatísticas no header

### Resultado visual esperado
Cada seção passará de ~60px por item (card com padding + border + margin) para ~40px por linha de tabela, reduzindo significativamente o espaço vertical total.

