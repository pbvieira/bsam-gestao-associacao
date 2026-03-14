

## Plano: Remover novamente a opção "Ficha Completa" do menu Imprimir

### Alteração em `src/components/students/student-form.tsx`

Remover as linhas 673-677 que contêm o `DropdownMenuItem` da "Ficha Completa" e o `DropdownMenuSeparator` logo abaixo:

```tsx
// REMOVER:
<DropdownMenuItem onClick={() => window.open(`/alunos/${savedStudentId}/imprimir`, "_blank")}>
  <FileText className="h-4 w-4 mr-2" />
  Ficha Completa
</DropdownMenuItem>
<DropdownMenuSeparator />
```

O menu manterá apenas os 4 documentos legais: Autorização de Imagem, Declaração de Integração Voluntária, Declaração de Participação na Socialização e Termo de Responsabilidade.

