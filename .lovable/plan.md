

## Avaliação: Consulta de CEP via ViaCEP

### Viabilidade

**É viável e não é excessivamente complexo.** A API ViaCEP é gratuita, pública e sem necessidade de chave. O desafio principal é o fluxo sequencial (setar estado → esperar cidades carregarem → selecionar cidade), mas isso se resolve com um estado intermediário "pendingCity".

### Abordagem

1. Adicionar máscara de CEP ao `MaskedInput` (formato `#####-###`)
2. No `onBlur` do campo CEP, se tiver 8 dígitos, consultar `https://viacep.com.br/ws/{cep}/json/`
3. Com o retorno, preencher: `endereco` (logradouro), `bairro`, e setar `estado` (UF)
4. Guardar o nome da cidade em um state `pendingCityFromCep`
5. No `useEffect` que carrega cidades do endereço (linhas 189-214), após as cidades carregarem, verificar se há `pendingCityFromCep` e selecionar automaticamente

### Alterações

**`src/components/ui/masked-input.tsx`** — Adicionar máscara `cep`:
- `pattern`: `'#####-###'`, `maxLength`: 9, `maxDigits`: 8

**`src/components/students/tabs/student-basic-data-tab.tsx`**:
- Trocar `<Input>` do CEP por `<MaskedInput mask="cep">`
- Adicionar estado `pendingCityFromCep` e `loadingCep`
- Criar função `handleCepLookup` que consulta ViaCEP no `onBlur`
- No efeito de carregamento de cidades (linha 189), após carregar, verificar `pendingCityFromCep` e fazer `form.setValue('cidade', nomeDaCidade)`
- Mostrar indicador de loading no campo CEP durante a consulta

### Fluxo

1. Usuário digita o CEP e sai do campo
2. Sistema consulta ViaCEP → preenche endereço, bairro
3. Seta o estado (UF) → dispara carregamento de cidades
4. Quando cidades carregam, seleciona a cidade automaticamente
5. Usuário pode alterar qualquer campo manualmente depois

