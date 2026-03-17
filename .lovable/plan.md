

## Plano: Personalizar formulário para Plantão Psicológico e adicionar campos de Encaminhamento

### Alterações

#### 1. Banco de dados — 3 novas colunas em `student_medical_records`
- `consideracoes` (text, nullable) — campo exclusivo do Plantão Psicológico
- `houve_encaminhamento` (boolean, default false) — para todos os tipos
- `encaminhamento` (text, nullable) — detalhes do encaminhamento

#### 2. `src/hooks/use-student-medical-records.ts`
- Renomear label de `consulta_psicologica` para **"Plantão Psicológico"**
- Adicionar `consideracoes`, `houve_encaminhamento` e `encaminhamento` na interface `StudentMedicalRecord`

#### 3. `src/components/students/tabs/medical-record-dialog.tsx`
- Adicionar os 3 novos campos ao schema zod e ao form
- Observar `tipo_atendimento`: quando for `consulta_psicologica`, ocultar campos `especialidade`, `motivo`, `diagnostico`, `prescricao` e exibir o textarea **"Considerações"** com altura dobrada (`min-h-[160px]`)
- Para **todos os tipos**: adicionar switch "Houve encaminhamento?" e, se marcado, exibir textarea "Encaminhamento"
- No `onSubmit`, mapear os novos campos no payload

### Resumo de arquivos

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | Adicionar colunas `consideracoes`, `houve_encaminhamento`, `encaminhamento` |
| `src/hooks/use-student-medical-records.ts` | Renomear label, adicionar campos na interface |
| `src/components/students/tabs/medical-record-dialog.tsx` | Lógica condicional por tipo, novos campos no form |

