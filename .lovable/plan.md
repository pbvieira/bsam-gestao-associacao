

## Correção de alinhamento dos campos no modal de atendimento

O campo "Data do Atendimento" usa `FormItem className="flex flex-col"` enquanto o campo "Tipo de Atendimento" usa apenas `FormItem` sem essa classe. Isso causa o desalinhamento vertical.

### Correção

| Arquivo | Alteração |
|---------|-----------|
| `src/components/students/tabs/medical-record-dialog.tsx` | Adicionar `className="flex flex-col"` ao `FormItem` do campo "Tipo de Atendimento" (linha 224) |

