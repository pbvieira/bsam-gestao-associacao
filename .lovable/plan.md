# Ajuste do anel de foco cortado

## Causa
O `ScrollArea` da modal tem `overflow-hidden` no root e o viewport interno também. Os inputs ocupam 100% da largura disponível, então o anel de foco (`ring-2 ring-offset-2` ≈ 4px) que aparece *fora* da borda do input é cortado pelas laterais.

O `px-3` atual na `ScrollArea` é aplicado no root — o viewport rolável fica colado nas bordas mesmo assim, e os `TabsContent` herdam largura total sem respiro lateral.

## Correção
Em `src/components/pendencies/pendency-dialog.tsx`:

1. Remover `px-3` do `ScrollArea` (linha 140) e mover o espaçamento para dentro.
2. Adicionar `px-1` (ou `px-2`) em cada `TabsContent` (detalhes, checklist, comentários, histórico) para garantir folga lateral suficiente para o ring sem alterar a largura visual percebida.
3. Manter a altura fixa atual (`h-[calc(90vh-220px)] min-h-[400px]`) — sem mudança de layout.

Resultado: o anel azul de foco passa a aparecer completo nas laterais esquerda/direita em todos os campos, em todas as abas, sem alterar comportamento de rolagem nem altura da modal.

## Arquivos
- `src/components/pendencies/pendency-dialog.tsx` (somente classes Tailwind)
