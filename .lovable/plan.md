
# Implementação: Revisão completa do fluxo de Calendário

## 1. Migração de banco de dados

```sql
-- Cascade de exclusão nos filhos do evento
ALTER TABLE event_participants
  DROP CONSTRAINT IF EXISTS event_participants_event_id_fkey,
  ADD CONSTRAINT event_participants_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES calendar_events(id) ON DELETE CASCADE;
ALTER TABLE external_event_participants ... ON DELETE CASCADE;
ALTER TABLE event_reminders ... ON DELETE CASCADE;

-- Policy DELETE em calendar_events (organizador OU calendar.write)
CREATE POLICY "Event creators can delete events"
ON calendar_events FOR DELETE TO authenticated
USING (created_by = auth.uid() OR current_user_has_capability('calendar.write'));

-- Remover triggers de DB legados que duplicam lógica agora em app/edge:
--   notify_event_invitation, notify_event_update, notify_event_cancellation
-- (mantém create_event_reminders e process_event_reminders)

-- Trigger de limpeza: ao deletar evento, deletar notificações órfãs
CREATE FUNCTION cleanup_event_notifications() ... 
  DELETE notifications WHERE reference_id = OLD.id AND type IN
    ('calendar_invite','calendar_reminder','calendar_update','calendar_cancellation');
CREATE TRIGGER trg_cleanup_event_notifications BEFORE DELETE ON calendar_events ...
```

## 2. Nova edge function `send-event-update`

`supabase/functions/send-event-update/index.ts` + registro em `config.toml` (`verify_jwt = true`).

Recebe: `{ eventId, type: 'update' | 'cancellation', changedFields?: string[], targetParticipantIds?: string[], targetExternalEmails?: string[] }`

- Valida JWT e capability `calendar.write`.
- Busca evento (para `cancellation` aceita evento já deletado via histórico — nesse caso requisição vinda antes do delete).
- Para cada participante interno alvo (todos por padrão):
  - Insere notificação `calendar_update` ou `calendar_cancellation`.
  - Envia e-mail com ICS `METHOD:REQUEST` (SEQUENCE+1) ou `METHOD:CANCEL`.
- Para externos: e-mail equivalente (sem links de aceite no caso de cancel).

## 3. Edge function `send-event-invitation` (atualizar)

- Antes de enviar e-mails, **inserir notificações `calendar_invite` para cada participante interno** (`reference_id = eventId`).
- Manter envio de e-mail + ICS.
- Para externos, manter como está.

## 4. Hook `use-calendar.ts`

- `createEvent`: já chama `send-event-invitation` — manter.
- `updateEvent`: aceitar parâmetros opcionais `{ originalEvent, newParticipantIds, removedParticipantIds, newExternalParticipants, removedExternalEmails, significantChange }`:
  - Detectar mudanças em `data_inicio`, `data_fim`, `location`, `titulo`, `all_day`.
  - Se `significantChange` e há participantes restantes: invocar `send-event-update` (type='update').
- `deleteEvent`: **antes** de deletar, invocar `send-event-update` (type='cancellation') para que dados ainda existam; depois `DELETE`. O trigger `cleanup_event_notifications` cuida de notificações órfãs.

## 5. Hook `use-notifications.ts → respondToEventInvite`

- Recusa: trocar `DELETE FROM event_participants` por `UPDATE status='recusado'` (preserva histórico).
- Manter notificação ao organizador.
- Manter delete da notificação `calendar_invite` após resposta.

## 6. `EventForm` (refactor edição + UX)

- Trocar `alert()` por `toast` (memória "No native browser alerts").
- Layout flex: `DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden"`, ScrollArea `flex-1 min-h-0`, footer fixo (mesmo padrão da role-capabilities-modal).
- **Modo edição – diff inteligente** (não mais delete+insert cego):
  - `currentParticipantUserIds` vs `selectedParticipants` → calcula `added` e `removed`.
  - Para `removed`: `UPDATE status='cancelado'` (não DELETE) **OU** DELETE simples + send-event-update do cancelamento individual. Decisão: DELETE (limpa) e enviar e-mail informando exclusão do convite.
  - Para `added`: INSERT pendente + invoke `send-event-invitation` apenas com os novos.
  - Externos: comparar por e-mail; mesma lógica.
- Detectar mudança significativa em data/hora/local/título/all_day → invoke `send-event-update` para participantes não removidos/não-novos.
- Botão "Excluir evento" (apenas organizador) com `AlertDialog` → chama `deleteEvent`.

## 7. `PendingInvitations.tsx` (refonte completa da fonte de dados)

- Buscar diretamente:
```ts
event_participants
  .select('id, event_id, status, calendar_events(*)')
  .eq('user_id', user.id)
  .eq('is_organizer', false)
  .eq('status', 'pendente')
```
- Botões aceitar/recusar continuam usando `respondToEventInvite`.
- Mostrar também histórico opcional (toggle) de aceitos/recusados.

## 8. Sidebar — badge de convites pendentes

- Novo hook `use-pending-invitations-count` (realtime em `event_participants`).
- Adicionar `<Badge>` ao item "Convites Pendentes" da sidebar quando `count > 0`.

## 9. Memória

Atualizar `mem://features/calendar-system-architecture` e `mem://features/calendar-pending-invitations-page` com o fluxo revisado.

## Arquivos modificados

- **NOVO** `supabase/migrations/<timestamp>_calendar_flow_revision.sql`
- **NOVO** `supabase/functions/send-event-update/index.ts`
- `supabase/config.toml` (registrar nova função)
- `supabase/functions/send-event-invitation/index.ts`
- `src/hooks/use-calendar.ts`
- `src/hooks/use-notifications.ts`
- `src/hooks/use-pending-invitations-count.ts` (novo)
- `src/components/calendar/event-form.tsx`
- `src/components/navigation/sidebar.tsx`
- `src/pages/PendingInvitations.tsx`
- `mem://features/calendar-system-architecture`
- `mem://features/calendar-pending-invitations-page`

Após aprovação executo migração, deploy de edge functions, e refatorações de frontend numa única passada.
