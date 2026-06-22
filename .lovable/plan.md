## Objetivo

Simplificar a gestão de usuários removendo qualquer envio ou validação de e-mail. O administrador define senha e e-mail diretamente pela interface, sem fluxo de confirmação.

## Mudanças

### 1. Configuração do Supabase (Auth)
- Desativar "Confirm email" no projeto Supabase (autoconfirma usuários ao criar).
- Desativar "Secure email change" (não exige confirmação ao trocar e-mail).
- Essas opções ficam em **Authentication → Sign In / Providers → Email**. Como não temos API para alterar isso automaticamente, vou deixar um botão de atalho para o painel.

### 2. Edge function `create-user` (já existe)
- Garantir `email_confirm: true` no `admin.createUser` (já está, manter).
- Nenhum e-mail é enviado.

### 3. Nova edge function `admin-update-user-credentials`
- Recebe `{ user_id, new_email?, new_password? }`.
- Verifica capability `users.manage` do chamador.
- Usa `supabase.auth.admin.updateUserById(user_id, { email, password, email_confirm: true })`.
- Atualização imediata, sem envio de e-mail nem link de confirmação.

### 4. Refatorar `src/components/users/user-credentials-dialog.tsx`
- Remover o botão "Enviar email de reset".
- Substituir por campo **"Nova senha"** + **"Confirmar senha"** com validação (mínimo 6 caracteres) e botão **"Definir senha"** que chama a nova edge function.
- Manter campo **"Alterar e-mail"**, mas agora chamando a edge function (troca direta, sem confirmação).
- Remover o aviso amarelo sobre confirmação por e-mail; substituir por aviso de que a mudança é imediata.
- Remover a chamada a `supabase.auth.resetPasswordForEmail` e ao RPC `get_user_email`.

## Detalhes técnicos

- A edge function usa `SUPABASE_SERVICE_ROLE_KEY` (já configurado) e valida JWT do chamador + capability `users.manage` via RPC `current_user_has_capability`.
- Configuração toml: `verify_jwt = true` para a nova função.
- Nenhuma migração de banco necessária.

## Ação manual do usuário (após implementação)

No painel Supabase → Authentication → Providers → Email:
- Desmarcar **Confirm email**
- Desmarcar **Secure email change**

Vou incluir o link direto na resposta final.
