

## Plano: Adicionar logo nos documentos legais

### Abordagem
Copiar a imagem do logo para `src/assets/logo-obs.png` e adicioná-la no cabeçalho dos documentos, acima do texto institucional. A alteração será feita nos dois componentes que renderizam o cabeçalho dos documentos.

### Alterações

1. **Copiar imagem** — `user-uploads://2026-03-14_20-48.png` → `src/assets/logo-obs.png`

2. **`src/components/documents/generic-document-renderer.tsx`** — Importar o logo e adicionar `<img>` centralizado no topo do `<header>`, antes do `header_line1`

3. **`src/components/documents/template-preview.tsx`** — Mesma alteração para o preview do editor

O logo será exibido com largura de ~120px, centralizado, com margem inferior antes do texto do cabeçalho. Será visível tanto na tela quanto na impressão.

