

## Plano: Corrigir erro ao armazenar documento assinado digitalmente

### Causa provável

O fluxo de armazenamento passa por 3 etapas: `html2canvas` → `jsPDF` → upload ao Storage. Sem logs de console visíveis, as causas mais prováveis são:

1. **Nome do arquivo com caracteres especiais**: O `filePath` no Storage inclui o título do template (ex: `"Autorização de Imagem - João Silva - 2026-03-15.pdf"`), que contém acentos e espaços. O Supabase Storage pode rejeitar certos caracteres no path.

2. **`html2canvas` falhando com CORS**: A captura do DOM pode falhar se recursos externos (imagens, fontes) tiverem restrições de cross-origin.

3. **`return { error: 'Dados insuficientes' }`**: Se por algum motivo `user` for `null` no momento do clique (ex: token expirado), o upload nem é tentado.

### Correções

#### 1. `src/hooks/use-student-documents.ts`
- Sanitizar o `filePath` removendo acentos e caracteres especiais antes do upload ao Storage (normalizar com `normalize('NFD')` e substituir caracteres não-ASCII).

#### 2. `src/components/documents/generic-document-renderer.tsx`
- Melhorar o tratamento de erros com logs mais detalhados em cada etapa (html2canvas, jsPDF, upload).
- Sanitizar o `fileName` antes de passar ao `uploadDocument`.
- Adicionar fallback caso `html2canvas` falhe (tentar sem `useCORS`/`allowTaint`).

### Resumo de arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/use-student-documents.ts` | Sanitizar `filePath` para remover acentos/caracteres especiais |
| `src/components/documents/generic-document-renderer.tsx` | Sanitizar fileName, melhorar logs de erro em cada etapa |

