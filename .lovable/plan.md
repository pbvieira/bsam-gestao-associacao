

## Plano: Estender regra de desabilitação de campos de filiação

### Situação atual

A constante `ESTADOS_DATA_OPCIONAL` na linha 18 de `student-basic-data-tab.tsx` contém apenas:
- `'Desconhecido(a)'`
- `'Não declarado(a) no registro'`

### Alteração

Adicionar `'Ausente / sem contato'` e `'Falecido(a)'` à lista:

```ts
const ESTADOS_DATA_OPCIONAL = [
  'Desconhecido(a)', 
  'Não declarado(a) no registro',
  'Ausente / sem contato',
  'Falecido(a)'
];
```

Isso fará com que, ao selecionar qualquer um desses 4 estados para pai ou mãe, os campos de data de nascimento e checkbox "Não sabe" sejam desabilitados/ocultados automaticamente, usando a mesma lógica já existente.

