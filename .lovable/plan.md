
# Plano de migração — Roles dinâmicos via Capabilities

## Objetivo

Substituir o enum fixo `user_role` (`aluno`, `auxiliar`, `coordenador`, `diretor`, `administrador`) por um modelo onde:

- Papéis são **linhas em uma tabela** (`roles`), criáveis pela interface.
- Permissões são **capabilities granulares** (strings), associadas a papéis em `role_capabilities`.
- Toda RLS, edge function e UI consulta uma função única `has_capability(user_id, capability)` em vez de comparar nomes de papéis.

Os 5 papéis atuais permanecem como linhas “de sistema” (`is_system=true`) e não podem ser excluídos. Capabilities são fixas no código (catálogo conhecido); o que é dinâmico é a combinação papel ↔ capabilities e a criação de novos papéis.

---

## 1. Modelo de dados novo

```text
roles                       capabilities (catálogo, opcional)   role_capabilities
-----                       ---------------------------------   -----------------
id uuid pk                  key text pk                         role_id uuid (fk roles)
key text unique             label text                          capability text
label text                  module text                         allowed bool
description text                                                 (pk: role_id, capability)
is_system bool default false
ativo bool default true
ordem int
created_at, updated_at

profiles
--------
role_id uuid (fk roles.id) ← novo
role user_role             ← mantido temporariamente (espelho), removido na Fase 6
```

`role_module_access` é mantida e populada por trigger a partir de `role_capabilities` (capabilities `module.<name>.read`), para não quebrar a tela de Gestão de Permissões durante a transição. No fim, `role_module_access` é descontinuada.

---

## 2. Catálogo de capabilities (proposta inicial)

Granularidade por módulo e ação. Mapeamento dos papéis atuais:

| Capability | adm | diretor | coord | aux | aluno |
|---|---|---|---|---|---|
| `system.admin` | x | | | | |
| `users.manage` | x | x | x | | |
| `roles.manage` | x | x | | | |
| `students.read` | x | x | x | x | |
| `students.write` | x | x | x | x | |
| `students.delete` | x | x | | | |
| `students.health.read` | x | x | x | x | |
| `students.health.write` | x | x | x | x | |
| `students.financial.read` | x | x | x | x | |
| `tasks.read` / `tasks.write` / `tasks.delete` | x | x | x | x | aluno: read próprias |
| `calendar.read` / `calendar.write` | x | x | x | x | aluno: read |
| `inventory.read` / `inventory.write` / `inventory.manage` | x | x | x | aux: read+write | |
| `purchases.read` / `purchases.write` / `purchases.approve` | x | x | x | aux: read+write | |
| `suppliers.read` / `suppliers.manage` | x | x | x | aux: read | |
| `reports.read` | x | x | x | | |
| `aux_tables.manage` (todas as auxiliares) | x | x | x | | |
| `documents.templates.manage` | x | x | x | | |
| `medications.administer` | x | x | x | x | |

Capability especial: `system.admin` substitui a noção de “administrador” em regras como “último admin”.

---

## 3. Funções SECURITY DEFINER novas

```sql
-- Núcleo
public.has_capability(_user_id uuid, _cap text) returns boolean
public.current_user_has_capability(_cap text) returns boolean   -- usa auth.uid()
public.current_user_has_any(_caps text[]) returns boolean
public.get_current_user_role_key() returns text                 -- substitui get_current_user_role()
public.is_system_admin(_user_id uuid) returns boolean           -- has_capability(_user_id, 'system.admin')
public.count_active_system_admins() returns int                 -- substitui count_active_admins()
```

Todas com `STABLE SECURITY DEFINER SET search_path = public`. `has_capability` faz join `profiles → roles → role_capabilities` e ainda lê `roles.is_system` para regras especiais.

Funções **a substituir** (manter assinaturas como wrappers durante transição, depois remover):

- `is_admin_user(uuid)` → wrapper de `has_capability(uuid, 'system.admin') OR has_capability(uuid, 'users.manage')` durante transição; remover na Fase 6.
- `get_current_user_role()` → wrapper de `get_current_user_role_key()`; remover na Fase 6.
- `count_active_admins()` → wrapper; remover na Fase 6.
- `prevent_last_admin_deletion()` (trigger) → reescrever para usar `count_active_system_admins()`.
- `handle_new_user()` → setar `role_id` (lookup pela `key` vinda do metadata) além de `role` legado.

---

## 4. Lista EXAUSTIVA de RLS policies a reescrever

Todas estas referenciam o enum `user_role`, `is_admin_user`, ou `get_current_user_role`. Cada uma será **dropada e recriada** no mesmo migration, trocando o teste de papel por `has_capability(...)`.

### 4.1 Tabelas auxiliares / parametrização (padrão: capability `aux_tables.manage`)

- `annotation_categories` — `Administradores podem gerenciar categorias`
- `areas` — `Administradores podem gerenciar áreas`
- `benefit_types` — `Administradores podem gerenciar tipos de benefício`
- `cash_book_entry_categories` — `Administradores podem gerenciar categorias de entrada`
- `cash_book_exit_categories` — `Administradores podem gerenciar categorias de saída`
- `disability_types` — `Administradores podem gerenciar tipos de deficiências`
- `disease_types` — `Administradores podem gerenciar tipos de doenças`
- `filiation_status` — `Administradores podem gerenciar status`
- `income_types` — `Administradores podem gerenciar tipos de renda`
- `inventory_categories` — `Administradores podem gerenciar categorias`
- `medication_usage_types` — `Administradores podem gerenciar tipos de uso`
- `setores` — `Administradores podem gerenciar setores`
- `vaccine_types` — `Administradores podem gerenciar tipos de vacinas`
- `work_situations` — `Administradores podem gerenciar situações trabalhistas`
- `system_settings` — `Diretores e administradores podem gerenciar configurações` → `system.admin`
- `role_module_access` — `Diretores e administradores podem gerenciar permissões` → `roles.manage`

(As policies de SELECT “Todos podem ver … ativos” não dependem de role e **não** mudam.)

### 4.2 Documentos e templates

- `document_templates` — `Admins can manage templates` → `documents.templates.manage`
- `document_templates` — `Authenticated users can view templates` (não muda)

### 4.3 Calendário

- `calendar_events` — `Simple calendar events select policy` → `calendar.read` ou criador/participante
- `calendar_events` — `Simple calendar events update policy` → `calendar.write` ou criador
- `calendar_events` — `Users can create events` (WITH CHECK) → `calendar.write`
- `event_participants` — `Event creators can manage participants` → `calendar.write` (admin) ou criador
- `event_participants` — `Users can view event participants` → `calendar.read` (admin) ou participante
- `external_event_participants` — `Event organizers can manage external participants` → `calendar.write` ou criador

### 4.4 Inventário e compras

- `inventory_items` — `Coordinators and directors can manage inventory items` → `inventory.manage`
- `inventory_items` — `Users can view inventory items based on permissions` → `inventory.read`
- `inventory_movements` — `Users can create inventory movements` (WITH CHECK) → `inventory.write`
- `inventory_movements` — `Users can view inventory movements based on permissions` → `inventory.read`
- `purchase_orders` — `Users can create purchase orders` (WITH CHECK) → `purchases.write`
- `purchase_orders` — `Users can update their own purchase orders` → criador (status pendente) OR `purchases.approve`
- `purchase_orders` — `Users can view purchase orders based on permissions` → `purchases.read`
- `purchase_order_items` — `Users can manage purchase order items based on order permission` → mesma regra de `purchase_orders`
- `purchase_order_items` — `Users can view purchase order items based on order permissions` → `purchases.read`
- `suppliers` — `Coordinators and directors can manage suppliers` → `suppliers.manage`
- `suppliers` — `Users can view suppliers based on permissions` → `suppliers.read`

### 4.5 Saúde (médico/medicação)

- `medical_appointment_log` — `Authorized users can manage appointment logs` → `students.health.write`
- `medical_appointment_log` — `Authorized users can view appointment logs` → `students.health.read`
- `medication_administration_log` — `Authorized users can manage medication logs` → `medications.administer`
- `medication_administration_log` — `Authorized users can view medication logs` → `students.health.read`
- `medication_schedules` — `Authorized users can manage medication schedules` → `students.health.write`
- `medication_schedules` — `Authorized users can view medication schedules` → `students.health.read` ou dono

### 4.6 Profiles (sensível, ordem importa)

- `profiles` — `Admins can delete profiles` → `users.manage` AND `user_id <> auth.uid()`
- `profiles` — `Admins can view all profiles` → `users.manage`
- `profiles` — `Users can insert their own profile` (WITH CHECK) → `auth.uid()=user_id` AND (`role_id` aponta para role `aluno` OR `users.manage`)
- `profiles` — `Users can update profiles with admin access` → próprio OU `users.manage`; WITH CHECK protege `role_id` e `active` (só `users.manage` muda)
- `profiles` — `Users can view their own profile` (não muda)

### 4.7 Alunos e tabelas-filhas (padrão: `students.read` / `students.write`)

Para cada par de policies (manage + view) abaixo, trocar `role = ANY(...)` por `has_capability(..., 'students.write')` (manage) e `'students.read'` (view), **mantendo** o fallback de `p.user_id = s.user_id` (aluno vê seus próprios dados):

- `students` — `Authorized users can insert students`
- `students` — `Authorized users can update students`
- `students` — `Directors and administrators can delete students` → `students.delete`
- `students` — `Users can view students based on permissions`
- `student_basic_data` — manage + view
- `student_annotations` — manage + view
- `student_benefits_list` — manage + view
- `student_cash_book` — manage + view (`students.financial.*`)
- `student_children` — manage + view
- `student_children_list` — manage + view
- `student_disabilities` — manage + view
- `student_diseases` — manage + view
- `student_documents` — manage + view
- `student_emergency_contacts` — manage + view
- `student_health_data` — manage + view (`students.health.*`)
- `student_hospitalizations` — manage + view (`students.health.*`)
- `student_income_list` — manage + view (`students.financial.*`)
- `student_medical_records` — manage + view (`students.health.*`)
- `student_medications` — manage + view (`students.health.*`)
- `student_stays` — manage + view
- `student_vaccines` — manage + view (`students.health.*`)
- `student_work_situation` — manage + view

### 4.8 Tarefas

- `tasks` — `Users can create tasks` → `tasks.write`
- `tasks` — `Users can update their own tasks or assigned tasks` → criador/assigned OR `tasks.write`(admin)
- `tasks` — `Users can view tasks assigned to them or created by them` → criador/assigned OR `tasks.read`(admin)
- `tasks` — `Only creators and admins can delete tasks` → criador OR `tasks.delete`
- `task_attachments` — `Users can view attachments on accessible tasks` → segue `tasks`
- `task_comments` — `Users can view comments on accessible tasks` → segue `tasks`

### 4.9 Não mudam (por já não dependerem de role)

`event_reminders` (system + own), `external_event_participants` SELECT, `notifications` (todas), `notification_settings`, `profiles.Users can view their own profile`, todas as `Todos podem ver ... ativos` das auxiliares.

**Total: 80 policies** identificadas para reescrita.

---

## 5. Edge functions e código backend a atualizar

- `supabase/functions/create-user/index.ts` — receber `role_key`, fazer lookup em `roles`, gravar `role_id` no profile (e `role` legado durante transição). Validar com capability `users.manage` do chamador.
- `supabase/functions/delete-user/index.ts` — validar com `users.manage` em vez de role hardcoded; bloquear remoção do último `system.admin`.
- Trigger `handle_new_user` — setar `role_id` (default = role `aluno` quando primeiro perfil já existe; primeiro perfil = role `diretor`/system_admin).
- Trigger `prevent_last_admin_deletion` — reescrita para `count_active_system_admins()`.
- `process-event-reminders`, `process-invitation-response`, `send-event-invitation`, `send-inventory-alerts` — auditar; só mudam se chamarem checagem de role (ver no momento da Fase 4).

---

## 6. Frontend — arquivos com role hardcoded a refatorar

Identificados via grep (`'administrador'|'diretor'|'coordenador'|'auxiliar'|profile.role`):

- `src/contexts/AuthContext.tsx` — adicionar `capabilities: string[]`, função `can(cap)`. Buscar via nova `role_capabilities` join. Manter `canAccess(module)` como wrapper (`can('module.<x>.read')`).
- `src/hooks/use-auth.ts` — re-exports.
- `src/components/auth/unified-route.tsx` — aceitar prop `capability` além de `module`.
- `src/components/navigation/sidebar.tsx` — trocar checagens por `can(...)`.
- `src/hooks/use-navigation-fallback.ts` — idem.
- `src/components/users/user-form.tsx` — selector de papel passa a listar `roles` (tabela), não enum.
- `src/components/users/user-list.tsx` — exibir `role.label`; ações por capability.
- `src/components/users/user-credentials-dialog.tsx` — idem.
- `src/components/students/student-list.tsx` — botão Excluir gated por `can('students.delete')` (substitui `profile.role === 'administrador'`).
- `src/pages/Auth.tsx` — ajustar fluxo de signup default.
- `src/components/roles/role-permissions-table.tsx` + `role-access-matrix.tsx` + `role-permissions-modal.tsx` — reescritos para serem **gestão de papéis e capabilities**: CRUD de `roles`, matriz papel × capability.
- `src/pages/RoleManagement.tsx` — passa a usar capability `roles.manage`.
- `src/lib/role-access.ts` — substituído por `src/lib/capabilities.ts` com cache de capabilities.
- `src/hooks/use-role-access.ts` — substituído por `use-capabilities.ts` e `use-roles.ts`.

---

## 7. Plano em fases (executável sem downtime)

### Fase 1 — Estrutura paralela (sem quebrar nada)

Migration:
1. Criar tabelas `roles`, `role_capabilities` (e opcional `capabilities` catálogo).
2. Seed: inserir 5 papéis system (`administrador`, `diretor`, `coordenador`, `auxiliar`, `aluno`) com `is_system=true`, `key` igual ao enum.
3. Seed `role_capabilities` conforme matriz da seção 2.
4. Adicionar `profiles.role_id uuid` nullable + backfill via `UPDATE profiles SET role_id = (SELECT id FROM roles WHERE key = profiles.role::text)`.
5. Criar funções: `has_capability`, `current_user_has_capability`, `current_user_has_any`, `is_system_admin`, `count_active_system_admins`, `get_current_user_role_key`.
6. NÃO dropar nada ainda. Sistema continua funcionando pelo enum.

### Fase 2 — Sincronização bidirecional

Migration:
1. Trigger em `profiles` que mantém `role` (enum) e `role_id` em sincronia (qualquer um que mude propaga para o outro).
2. Trigger em `role_capabilities` que recalcula `role_module_access` para o role afetado (mapeando `module.<x>.read` → linha `(role, x, allowed)`).
3. Atualizar `handle_new_user` para preencher ambos.

### Fase 3 — Reescrita das 80 policies

Migration única, transacional, na ordem:
1. `DROP POLICY ... ON ...` para cada uma listada na seção 4.
2. `CREATE POLICY ...` versão nova usando `has_capability`/`current_user_has_capability`.
3. Testar com `SET ROLE` simulado por usuário de cada papel via `pgTAP` ou queries manuais.

Observação: a regra do criador/owner (`created_by = auth.uid()`, `user_id = auth.uid()`, joins via `students.user_id`) é **mantida idêntica**, só o ramo de “admin” muda.

### Fase 4 — Edge functions e triggers

1. Reescrever `prevent_last_admin_deletion` usando `count_active_system_admins`.
2. Atualizar `create-user` e `delete-user`.
3. Deploy edge functions (automático).

### Fase 5 — Frontend

1. Introduzir `useCapabilities`, `can()`.
2. Refatorar arquivos da seção 6 (um PR por área: navegação, alunos, usuários, gestão de papéis).
3. Reescrever `/gestao-roles` para CRUD de papéis dinâmicos.
4. Manter `canAccess(module)` como compat shim.

### Fase 6 — Limpeza (após estabilização em produção)

Migration final:
1. Remover triggers de sincronização.
2. `ALTER TABLE profiles DROP COLUMN role;`
3. `DROP TYPE user_role;` (após reescrever quaisquer outras referências residuais — checar `event_type`, `recurrence_type`, `participant_status` não são afetados).
4. `DROP FUNCTION is_admin_user, get_current_user_role, count_active_admins;`
5. `DROP TABLE role_module_access;` (substituída pela matriz de capabilities).
6. Remover `src/lib/role-access.ts`, `use-role-access.ts`.

---

## 8. Riscos e mitigações

- **RLS quebrar acesso silenciosamente**: cada policy reescrita acompanhada de teste `SELECT/INSERT` com usuário de cada papel antes do commit da Fase 3. Manter rollback SQL pronto (recriar policy antiga).
- **Esquecer policy**: a lista da seção 4 foi extraída via `pg_policies` filtrando por `user_role|is_admin_user|get_current_user_role`. Antes da Fase 3 rodar novamente o mesmo SELECT e diferenciar — se zero resultados após DROP/CREATE, cobertura está completa.
- **Enum referenciado em colunas que não `profiles.role`**: confirmar que `user_role` só é usado em `profiles.role` e dentro de funções/policies — verificar com `SELECT ... FROM information_schema.columns WHERE udt_name='user_role'` antes da Fase 6.
- **Front consultando `profile.role` em locais não mapeados**: rodar grep final antes da Fase 6 e falhar build se aparecer literal de role.
- **Último administrador**: `count_active_system_admins` usa capability `system.admin`. Garantir que pelo menos um papel seed tenha essa capability e que UI bloqueie remover a capability do último papel ativo com usuários.

---

## 9. Entregáveis por fase

1. **Fase 1**: 1 migration de schema + seeds.
2. **Fase 2**: 1 migration com triggers de sync.
3. **Fase 3**: 1 migration única reescrevendo as 80 policies (lista da seção 4).
4. **Fase 4**: edge functions atualizadas + 1 migration para triggers.
5. **Fase 5**: refactor de ~15 arquivos do front.
6. **Fase 6**: 1 migration de limpeza + remoção de código legado.

Após sua aprovação executo a partir da Fase 1. Recomendo aprovar fase a fase (cada fase é independente e reversível) em vez de tudo de uma vez.
