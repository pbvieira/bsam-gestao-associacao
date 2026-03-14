

## Plano: Assinatura Digital nos Documentos Legais

### Conceito

Sim, é viável. A ideia é adicionar um **campo de assinatura digital** (canvas para desenho) na área de assinatura do documento. O usuário pode assinar com o dedo ou caneta stylus em um tablet, e a assinatura aparece no documento impresso.

### Abordagem

Usar a biblioteca `signature_pad` (leve, sem dependências, funciona bem com touch/stylus) para criar um canvas de assinatura que:

1. Aparece na tela abaixo da linha de assinatura (substituindo a linha estática)
2. Permite desenhar com dedo, caneta ou mouse
3. Tem botões para **Limpar** e **Confirmar** a assinatura
4. Após confirmar, a assinatura é renderizada como imagem no documento
5. Na impressão, a assinatura aparece no lugar da linha de assinatura

### Alterações

1. **Instalar dependência** — `signature_pad` (biblioteca JS pura, ~30KB)

2. **`src/components/documents/signature-pad.tsx`** (novo) — Componente React que encapsula o `signature_pad`:
   - Canvas responsivo com borda pontilhada
   - Botões "Limpar" e "Assinar" (ocultos na impressão)
   - Após assinar, exibe a assinatura como `<img>` (data URL)
   - Suporte a touch events para tablets

3. **`src/components/documents/generic-document-renderer.tsx`** — Alterar a seção de assinatura (linhas 107-111):
   - Substituir a linha estática por o componente `SignaturePad`
   - Quando assinado, mostrar a imagem da assinatura acima do nome
   - Quando não assinado, mostrar o canvas para desenhar

### Fluxo do Usuário

1. Abre o documento no tablet
2. Lê o conteúdo do documento
3. Desenha a assinatura com a caneta/dedo no campo de assinatura
4. Clica "Confirmar Assinatura"
5. A assinatura aparece no documento como imagem
6. Clica "Imprimir" — o documento é impresso com a assinatura

### Observações

- A assinatura é **temporária** (apenas para impressão, não é salva no banco). Futuramente podemos adicionar persistência se necessário.
- O canvas se adapta ao tamanho da tela, funcionando bem em tablets e desktops.
- Na impressão, apenas a imagem da assinatura aparece (botões ficam ocultos).

