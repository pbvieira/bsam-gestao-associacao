## Gerenciamento do Prontuário com paginação e filtros

Hoje o Prontuário Médico carrega **todos** os registros de uma vez, sem filtros. Em uma internação de até 9 meses isso pode chegar facilmente a centenas de atendimentos, prejudicando desempenho e legibilidade.

A proposta é adicionar uma barra de filtros + paginação no card "Prontuário Médico" da aba Saúde, sem alterar o fluxo de cadastro/edição existente.

### O que muda na interface

Dentro do card **Prontuário Médico** (acima da lista atual):

1. **Barra de busca e filtros** (compacta, em uma linha que quebra no mobile):
   - Campo de **busca textual** (procura em profissional, local, motivo, diagnóstico, especialidade).
   - **Tipo de atendimento** (Select com as opções de `MEDICAL_RECORD_TYPES` + "Todos").
   - **Período** (Select rápido: Últimos 30 dias / 90 dias / 6 meses / Todo o período / Personalizado).
     - Quando "Personalizado": dois date pickers (de / até).
   - **Apenas com retorno pendente** (Switch).
   - Botão "Limpar filtros" aparece quando há algum filtro ativo.

2. **Estatísticas** (linha já existente) passam a refletir o resultado filtrado, mostrando também o total geral entre parênteses. Ex.: `Exibindo: 12 de 87`.

3. **Paginação** no rodapé do card:
   - 10 registros por página (configurável via Select: 10 / 25 / 50).
   - Componente `Pagination` já existente em `src/components/ui/pagination.tsx`.
   - Numeração com elipses para muitas páginas; controles Anterior/Próximo.

4. **Ordenação**: mantida por `data_atendimento DESC` (mais recente primeiro). Adicionar um toggle simples "Mais recentes / Mais antigos".

### Como ficará a busca (consulta no banco)

A busca/filtragem será feita **no servidor** (Supabase), não em memória, para escalar bem:

- Hook `useStudentMedicalRecords` ganhará parâmetros opcionais: `{ page, pageSize, search, tipo, dateFrom, dateTo, onlyPendingReturn, sortDir }`.
- A query usa:
  - `.eq('student_id', studentId)`
  - `.gte('data_atendimento', dateFrom)` / `.lte(...)` quando aplicável
  - `.eq('tipo_atendimento', tipo)` quando selecionado
  - `.gte('data_retorno', hoje)` quando "retorno pendente"
  - `.or('profissional.ilike.%x%,local.ilike.%x%,motivo.ilike.%x%,diagnostico.ilike.%x%,especialidade.ilike.%x%')` para busca textual (com debounce de 300ms no input)
  - `.order('data_atendimento', { ascending: sortDir==='asc' })`
  - `.range(from, to)` para paginação
  - `count: 'exact'` no select para retornar o total (necessário para a paginação).

### Privacidade preservada

A regra do "Plantão Psicológico" (privado) **permanece inalterada**: o badge "Privado" continua sendo exibido e o conteúdo sensível segue oculto conforme já implementado. Os filtros e a busca textual respeitam as mesmas RLS policies já existentes na tabela `student_medical_records`.

### Arquivos afetados

| Arquivo | Alteração |
|---|---|
| `src/hooks/use-student-medical-records.ts` | Aceitar parâmetros de filtro/paginação; retornar `total`, `page`, `pageSize`. Manter API de create/update/delete. |
| `src/components/students/tabs/student-health-tab.tsx` | Adicionar estado dos filtros, barra de filtros, paginação e contagem `Exibindo X de Y` no card Prontuário Médico. |
| `src/components/ui/pagination.tsx` | Reutilizado, sem alterações. |

### Detalhes técnicos

- Debounce do campo de busca para evitar consulta a cada tecla.
- Reset automático para página 1 quando qualquer filtro muda.
- Estado dos filtros mantido apenas no componente (não persistido) — escopo enxuto.
- Skeleton/loader leve enquanto a página carrega (sem piscar a lista inteira).
- Sem alterações de schema no banco — a tabela `student_medical_records` já tem `data_atendimento` e `tipo_atendimento` indexáveis pelo Postgres; se notarmos lentidão futura, podemos avaliar índice composto em migration separada.
