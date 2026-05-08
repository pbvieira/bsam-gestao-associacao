## Novo módulo: "Configurações do Sistema"

**Nome sugerido:** `system_settings` (rótulo: "Configurações do sistema"). Fica separado do grupo crítico `system` (que cuida de admin/usuários/funções) para que possa ser concedido a perfis administrativos intermediários sem dar poderes de admin total.

### Capabilities propostas (padrão visualizar/editar)

| Key | Rótulo | Descrição |
|---|---|---|
| `system_settings.read` | Visualizar configurações | Acessar a tela de Configurações Gerais e ler parâmetros (ex.: capacidade de alunos) |
| `system_settings.write` | Editar configurações | Alterar parâmetros globais do sistema |

Não incluo "Excluir" porque não há exclusão de configurações — são valores fixos editáveis. Se preferir manter o trio padrão (visualizar/editar/excluir) em todos os módulos, me avise.

### Mudanças

**1. `src/lib/capabilities-catalog.ts`**
Adicionar novo grupo `system-settings` (antes ou depois de `aux-tables`) com as duas capabilities acima, ícone `Settings`.

**2. Migration SQL** — inserir as capabilities como permitidas para os papéis que já têm `system.admin`:
```sql
INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT role_id, 'system_settings.read', true
FROM public.role_capabilities WHERE capability = 'system.admin' AND allowed = true
ON CONFLICT DO NOTHING;

INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT role_id, 'system_settings.write', true
FROM public.role_capabilities WHERE capability = 'system.admin' AND allowed = true
ON CONFLICT DO NOTHING;
```

**3. Proteger as rotas/UI** com as novas capabilities:
- `src/pages/SystemSettingsPage.tsx`: envolver em `UnifiedRoute module="system_settings" action="read"` (igual `RoleManagement`); desabilitar botão Salvar e o input se o usuário não tiver `system_settings.write`.
- `src/pages/Settings.tsx`: ocultar o item "Sistema" quando o usuário não tem `system_settings.read`.

**4. Barra de rolagem da modal de permissões (`src/components/roles/role-capabilities-modal.tsx`)**
A `ScrollArea` interna não está rolando porque o `DialogContent` cresce com o conteúdo até o `max-h-[85vh]` mas o flexbox do conteúdo não está sendo limitado corretamente em alguns casos. Ajuste:
- Garantir `min-h-0` na `ScrollArea` (`<ScrollArea className="flex-1 min-h-0 px-6 py-4">`) — sem isso, o filho flex não encolhe e a barra interna nunca aparece.
- Verificar se o `DialogContent` mantém `overflow-hidden` (já está implícito).

Esse é o fix mínimo; após ele a barra de rolagem vertical aparece corretamente sempre que a lista exceder a altura disponível.

### Resumo dos arquivos tocados
- editar `src/lib/capabilities-catalog.ts`
- editar `src/components/roles/role-capabilities-modal.tsx` (min-h-0)
- editar `src/pages/SystemSettingsPage.tsx` (UnifiedRoute + write check)
- editar `src/pages/Settings.tsx` (ocultar item se sem read)
- nova migration em `supabase/migrations/` concedendo as capabilities aos papéis com `system.admin`
