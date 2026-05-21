
# Vacinação em grupo — fluxo proposto

## Visão geral

Três etapas claras: **Encaminhar → Agrupar/Agendar → Concluir em lote**.

```text
Aba Saúde do aluno          Página "Vacinação pendente"        Tarefa de ida ao posto
─────────────────────       ────────────────────────────       ──────────────────────
[Encaminhar p/ vacina] ──►  Fila agrupada por tipo de vacina   ──►  Concluir em lote
                            Selecionar alunos + data + setor        Marca data_vacinacao
                            Gera 1 tarefa vinculada                 nos alunos presentes
```

## 1. Encaminhar (aba Saúde › Vacinas)

- Na tabela de vacinas, adicionar coluna **Ação** com botão **"Encaminhar para vacinação"** (ícone seta) na linha de cada vacina cujo status é `Não` ou `-`.
- Ao clicar: insere registro em `vaccination_queue` (aluno + vaccine_type) com status `pendente`. Toast confirma "Aluno adicionado à fila de vacinação".
- Se já estiver na fila, o botão mostra estado **"Na fila"** (desabilitado, com opção de remover).
- Indicador visual discreto (badge amarelo "Aguardando vacinação") na linha enquanto pendente.

## 2. Página "Vacinação pendente"

Nova página em **Saúde › Vacinação pendente** (sidebar) e atalho no Dashboard quando há pendências.

Layout:
- **Lista agrupada por tipo de vacina**, cada grupo expansível:
  - Cabeçalho: nome da vacina + cor + contador ("3 alunos aguardando")
  - Linhas: foto/nome do aluno, código_cadastro, data de inclusão na fila, botão remover
  - Botão do grupo: **"Agendar ida ao posto"**
- Filtros: por vacina, por período de inclusão, busca por nome.

Diálogo "Agendar ida ao posto":
- Checkbox para selecionar quais alunos do grupo entram nessa ida (default: todos)
- **Data prevista** (opcional — se vazio, tarefa fica sem vencimento)
- **Setor responsável** (Saúde por padrão)
- **Responsável** (assigned_to)
- Observações
- Botão **Criar tarefa** → cria 1 registro em `vaccination_trips` + 1 `task` vinculada (reference_type `vaccination_trip`), e marca os itens da fila com `trip_id`.

A tarefa criada tem título tipo `"Vacinação: Febre Amarela (3 alunos)"` e descrição listando os alunos.

## 3. Conclusão em lote

Dois pontos de acesso para concluir:
- Botão **"Registrar vacinação"** na própria página de Vacinação Pendente (no card da viagem agendada).
- Botão na tarefa correspondente (na página de Tarefas), substituindo o "Concluir" padrão quando `reference_type = 'vaccination_trip'`.

Diálogo de conclusão:
- **Data da vacinação** (default: hoje)
- Lista dos alunos vinculados com switch **Foi vacinado?** (default: Sim) e campo opcional "Motivo" quando Não.
- Botão **Confirmar**:
  - Para cada aluno marcado como vacinado: upsert em `student_vaccines` com `tomou=true` e `data_vacinacao=<data>`.
  - Para não vacinados: volta para a fila (mantém pendente) com observação.
  - Marca `vaccination_trips.status='realizada'` e `task.status='realizada'`.
  - Remove os itens vacinados da fila.

## 4. Detalhes técnicos

### Banco

- **`vaccination_queue`**: `id`, `student_id`, `vaccine_type_id`, `trip_id` (nullable), `status` (`pendente`/`agendada`/`cancelada`), `added_by`, `observacoes`, timestamps. UNIQUE(student_id, vaccine_type_id) WHERE status != 'cancelada'.
- **`vaccination_trips`**: `id`, `vaccine_type_id`, `data_prevista`, `data_realizada`, `setor_id`, `responsavel_id`, `task_id`, `status` (`agendada`/`realizada`/`cancelada`), `observacoes`, timestamps.
- RLS: leitura via `students.health.read`; escrita via `students.health.write`. Mesma capability já usada nas vacinas.
- Cascade: deletar `vaccination_trip` libera itens da fila de volta a `pendente`.

### Frontend

- Hook `use-vaccination-queue.ts` — list, addToQueue, removeFromQueue.
- Hook `use-vaccination-trips.ts` — create, completeTrip (lote), cancel.
- Componentes:
  - `vaccination-queue-button.tsx` (botão na tabela de vacinas, em `student-vaccines-section.tsx`).
  - `pages/VaccinationPending.tsx` (nova página com MainLayout).
  - `schedule-vaccination-trip-dialog.tsx`.
  - `complete-vaccination-trip-dialog.tsx`.
- Sidebar: novo item "Vacinação pendente" sob seção Saúde (com badge contador de pendentes).
- Dashboard: card opcional "Vacinações aguardando agendamento" mostrando contagem por tipo.

### Tarefa integrada (sem evento de calendário obrigatório)

- Tarefa criada com `reference_type = 'vaccination_trip'`, `reference_id = trip.id`.
- Quando o usuário abre a tarefa, mostra link "Abrir registro da vacinação" que leva ao diálogo de conclusão em lote.
- Calendário fica opcional: usuário pode criar evento manualmente se quiser (não bloquear o fluxo).

## 5. Por que esse fluxo é eficiente

- **Zero fricção no momento certo**: o agente da saúde sinaliza a necessidade sem precisar planejar a logística.
- **Acúmulo natural**: a fila cresce conforme novos alunos chegam, sem duplicar trabalho.
- **Decisão única de agendamento**: ao olhar a fila, o coordenador decide "vamos hoje" com base em quantos têm pendência da mesma vacina.
- **Registro em lote**: uma única ação preenche `data_vacinacao` para vários alunos, evitando 10 cliques separados.
- **Reaproveita infra existente**: usa tasks, sectors, students.health capabilities, sem inventar paralelo.

## 6. Fora do escopo desta entrega

- Geração automática de evento de calendário (fica como opcional manual).
- Notificação por e-mail aos responsáveis.
- Histórico/relatório consolidado de viagens (pode vir depois em Relatórios).
