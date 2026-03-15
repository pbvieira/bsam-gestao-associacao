

## Plano: Armazenar documentos assinados digitalmente como PDF

### Contexto
Os documentos legais (Autorização de Imagem, Integração Voluntária, etc.) são renderizados via `GenericDocumentRenderer` com `SignaturePad`. Hoje só existe o botão "Imprimir". O usuário quer que, após assinatura digital, haja a opção de gerar um PDF e armazená-lo no Supabase Storage, aparecendo na aba Documentos do aluno.

### Alterações necessárias

#### 1. Instalar dependências
- `html2canvas` — captura o DOM do documento como imagem
- `jspdf` — converte a imagem capturada em PDF

#### 2. Nova categoria de documento
Adicionar `documentos_assinados` na lista de categorias do `student-documents-tab.tsx` (SelectContent) para que os PDFs gerados apareçam com essa classificação.

#### 3. Componente `GenericDocumentRenderer` — adicionar botão "Armazenar"
- Receber nova prop `studentId` (opcional)
- O `SignaturePad` já expõe `onSignatureChange` — usar para saber quando há assinatura confirmada
- Quando `isSigned === true` e `studentId` está disponível, exibir botão "Armazenar" ao lado do botão "Imprimir"
- Ao clicar em "Armazenar":
  1. Usar `html2canvas` para capturar o `.print-container` como canvas
  2. Converter para PDF via `jsPDF` (formato A4)
  3. Chamar `uploadDocument` do hook `useStudentDocuments` com categoria `documentos_assinados` e nome baseado no título do template + data
  4. Exibir toast de sucesso/erro

#### 4. Páginas de documento — passar `studentId`
Atualizar as 4 páginas de documento (`StudentImageAuthorization`, `StudentResponsibilityTerm`, `StudentVoluntaryIntegration`, `StudentSocializationParticipation`) para passar o `id` do aluno como prop `studentId` ao `GenericDocumentRenderer`.

#### 5. Componente `SignaturePad` — expor estado da assinatura
O `SignaturePad` já tem `onSignatureChange` callback. O `GenericDocumentRenderer` precisa capturar esse callback para controlar a visibilidade do botão "Armazenar".

### Fluxo do usuário
1. Abre documento via menu "Imprimir"
2. Assina digitalmente no canvas
3. Confirma assinatura
4. Aparecem dois botões: **Imprimir** e **Armazenar**
5. Ao clicar "Armazenar": PDF é gerado e salvo no Storage
6. O documento aparece na aba "Documentos" do aluno com categoria "Documentos Assinados"

### Resumo de arquivos

| Arquivo | Alteração |
|---------|-----------|
| `package.json` | Adicionar `html2canvas` e `jspdf` |
| `src/components/documents/generic-document-renderer.tsx` | Adicionar prop `studentId`, estado de assinatura, botão "Armazenar" com lógica de geração PDF |
| `src/pages/StudentImageAuthorization.tsx` | Passar `studentId={id}` |
| `src/pages/StudentResponsibilityTerm.tsx` | Passar `studentId={id}` |
| `src/pages/StudentVoluntaryIntegration.tsx` | Passar `studentId={id}` |
| `src/pages/StudentSocializationParticipation.tsx` | Passar `studentId={id}` |
| `src/components/students/tabs/student-documents-tab.tsx` | Adicionar categoria `documentos_assinados` |

