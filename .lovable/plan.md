

## Plano: Corrigir travamento quando perfil não existe

### Problema
O `AuthContext` busca o perfil do usuário após login. Quando o perfil não existe (usuário excluído), o erro é capturado mas o estado `user` permanece preenchido e `profile` fica `null`. O `UnifiedRoute` verifica `needsProfile = user && !profile` e mostra o skeleton infinitamente.

### Solução

**`src/contexts/AuthContext.tsx`**: Na função `fetchUserProfile`, quando o fetch falha (perfil não encontrado), fazer `signOut()` automaticamente para limpar a sessão inválida. Isso resolve tanto o travamento atual quanto protege contra cenários futuros similares.

Alteração na função `initializeAuth` (~linha 40-55):

```ts
if (session?.user) {
  setSession(session);
  setUser(session.user);
  try {
    await fetchUserProfile(session.user.id);
  } catch (error) {
    console.error('Profile not found, signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }
}
```

E também no `onAuthStateChange` (~linha 190-200), tratar o erro do `fetchUserProfile` fazendo sign out em vez de apenas logar o erro.

### Resultado
- Se um usuário logado não tem perfil, será deslogado automaticamente e redirecionado para a tela de login
- Resolve o travamento imediato no preview do Lovable

