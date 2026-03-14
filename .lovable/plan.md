

## Plano: Remover funcionalidade "Gerar evento no calendário" dos medicamentos

### Escopo da remoção

A funcionalidade envolve: ao cadastrar um horário de administração de medicamento, o usuário pode ativar um Switch "Gerar evento no calendário" que cria eventos individuais no `calendar_events` para cada dia do tratamento. Com o painel de Administração de Medicamentos já servindo como ferramenta principal de controle, essa funcionalidade se tornou redundante.

### Arquivos afetados

**1. `src/components/students/tabs/medication-dialog.tsx`**
- Remover o Switch "Gerar evento no calendário" e o campo "Setor Responsável" condicional da UI de horários
- Remover import do `useSetores`
- Simplificar o estado dos schedules removendo `gerar_evento` e `setor_responsavel_id`

**2. `src/hooks/use-student-medications.ts`**
- Remover a interface `ScheduleInput.gerar_evento` e `ScheduleInput.setor_responsavel_id`
- Remover a função `createCalendarEvents` (~60 linhas)
- Remover a função `deleteOldCalendarEvents` (~40 linhas)
- Remover a função helper `generateEventDates` (~30 linhas)
- Remover as chamadas a essas funções em `createMedication`, `updateMedication` e `deleteMedication`
- Simplificar os objetos de insert dos schedules (sempre `gerar_evento: false`, ou remover)

**3. `src/components/students/tabs/student-health-tab.tsx`**
- Remover o ícone de calendário condicional exibido ao lado do horário (`sched.gerar_evento`)

**4. Database (migration)**
- A coluna `gerar_evento` e `calendar_event_id` e `setor_responsavel_id` na tabela `medication_schedules` podem ser mantidas por enquanto (não quebram nada), ou opcionalmente dropadas. Recomendo manter para não perder dados históricos -- apenas ignorar no código.

### O que NÃO será alterado
- A tabela `medication_schedules` no banco (colunas ficam, apenas não são mais usadas)
- O painel de Administração de Medicamentos (`/medicacoes`) -- continua funcionando normalmente
- Eventos de calendário já existentes -- permanecem no banco

### Resultado
Aproximadamente 130 linhas de código removidas, interface do diálogo de medicamentos simplificada.

