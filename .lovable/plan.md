

## Plano: Corrigir perda de dados do card Profissão e Emprego ao adicionar rendas/benefícios

### Causa raiz

O problema tem duas partes encadeadas:

1. **`useStudentWorkSituation`** (linha ~47): O `useEffect` depende de `[user, studentId]`. O objeto `user` do AuthContext muda de referência quando ocorre um token refresh (o listener `onAuthStateChange` chama `setUser(session.user)` criando nova referência). Isso re-executa `fetchWorkSituation`, que faz `setWorkSituation(data)` com um novo objeto.

2. **`student-work-tab.tsx`** (linhas 198-210): O `useEffect` que observa `[workSituation, form]` chama `form.reset(...)` toda vez que `workSituation` muda de referência. Isso sobrescreve os dados digitados pelo usuário com os valores do banco (que ainda não foram salvos).

**Fluxo do bug**: Usuário preenche campos → adiciona renda/benefício → operação async pode coincidir com token refresh → `user` muda referência → `fetchWorkSituation` re-executa → `workSituation` recebe novo objeto → `form.reset()` apaga dados não salvos.

### Correções

#### 1. `src/hooks/use-student-work-situation.ts`
- Trocar dependência do `useEffect` de `[user, studentId]` para `[user?.id, studentId]` — evita re-fetch quando o objeto `user` muda de referência mas o ID permanece o mesmo.

#### 2. `src/components/students/tabs/student-work-tab.tsx`
- Adicionar um `useRef` (`initialLoadDone`) para controlar que o `form.reset()` com dados do banco só execute na primeira carga.
- Após o primeiro reset, marcar `initialLoadDone.current = true` e não resetar mais — os dados do formulário passam a ser a fonte de verdade até o salvamento.

### Resumo de arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/use-student-work-situation.ts` | Dependência `user` → `user?.id` |
| `src/components/students/tabs/student-work-tab.tsx` | Guard no `form.reset` para executar apenas no carregamento inicial |

