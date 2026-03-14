

## Plano: Adicionar visualizador de PDF nos documentos do aluno

### Abordagem

Transformar o `ImageViewerDialog` em um visualizador genérico de arquivos que suporte tanto imagens quanto PDFs. O PDF será renderizado usando um `<iframe>` com a URL assinada do Supabase Storage, que o navegador exibe nativamente.

### Arquivos afetados

**1. `src/components/students/tabs/image-viewer-dialog.tsx`**
- Renomear para `DocumentViewerDialog` (ou manter o arquivo, apenas expandir)
- Adicionar prop `fileType` para distinguir entre `image` e `pdf`
- Quando `fileType === 'pdf'`: renderizar `<iframe src={url}>` em tela cheia no dialog
- Quando `fileType === 'image'`: manter comportamento atual (zoom, rotação)
- Ocultar botões de zoom/rotação quando for PDF (não se aplicam)

**2. `src/components/students/tabs/student-documents-tab.tsx`**
- Adicionar helper `isPdfFile(mimeType)` → verifica `application/pdf`
- Expandir a condição do botão "Visualizar" (Eye) para incluir PDFs além de imagens
- Passar o tipo de arquivo para o dialog

### Detalhes técnicos

- PDFs são visualizados nativamente pelo navegador via `<iframe>` — não precisa de biblioteca externa
- A URL assinada do Supabase Storage já funciona para PDFs
- O dialog mantém o toolbar com nome do arquivo, botão de download e fechar
- Zoom e rotação ficam disponíveis apenas para imagens

### Resultado
Botão de visualizar aparece para imagens e PDFs. Ao clicar em um PDF, abre o dialog com o PDF renderizado inline.

