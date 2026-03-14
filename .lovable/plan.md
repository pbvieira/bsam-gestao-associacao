

## Plano: Modal de confirmação para exclusão de documento

### Abordagem
Adicionar um `AlertDialog` (já disponível no projeto) para confirmar a exclusão de documentos, substituindo a chamada direta ao `deleteDocument`.

### Alterações em `src/components/students/tabs/student-documents-tab.tsx`

1. Importar componentes do `AlertDialog`
2. Adicionar estado `documentToDelete` para armazenar o documento selecionado para exclusão
3. No botão de `Trash2`, em vez de chamar `deleteDocument` diretamente, setar o `documentToDelete`
4. Adicionar o `AlertDialog` no JSX com mensagem "Tem certeza que deseja excluir este documento?" e botões Cancelar/Excluir
5. No botão "Excluir" do dialog, chamar `deleteDocument(documentToDelete)` e limpar o estado

