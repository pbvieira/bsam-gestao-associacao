

## Plano: Mostrar controle de convívio e pensão sempre

### Problema
O card "Situação Familiar" com os switches de convívio e pensão só aparece quando `children.length > 0` (linha 109). Se o aluno não tem filhos cadastrados, os controles ficam ocultos.

### Correção
**`src/components/students/tabs/student-children-tab.tsx`**: Remover a condição `children.length > 0` da linha 109, fazendo o card "Situação Familiar" aparecer sempre que houver `studentId`. Os controles de convívio e pensão devem ser independentes da lista de filhos.

Alteração única: linha 109 `{children.length > 0 && (` → remover essa condição (e o `)}` correspondente na linha 160).

