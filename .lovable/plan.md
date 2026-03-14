

## Plano: Editor de Templates de Documentos Legais

### Conceito
Criar uma funcionalidade que permite editar o conteúdo dos 4 documentos legais (Autorização de Imagem, Declaração de Integração Voluntária, Declaração de Participação na Socialização, Termo de Responsabilidade) sem precisar alterar código. Os templates ficam salvos no banco de dados e suportam variáveis como `{{nome}}`, `{{rg}}`, `{{cpf}}`, `{{data}}`, `{{cidade}}`.

### Abordagem

Os 4 documentos compartilham a mesma estrutura:
1. **Cabeçalho institucional** (nome da associação, endereço) - editável
2. **Título do documento** - editável
3. **Corpo do texto** (parágrafos com variáveis do aluno) - editável
4. **Seção de assinatura** - fixa (cidade, data, nome)

O editor será uma página acessível via menu lateral (ou dentro de Configurações), onde o usuário seleciona um dos 4 templates, edita os campos em textareas, e salva. As variáveis disponíveis (`{{nome}}`, `{{rg}}`, `{{cpf}}`, `{{data}}`, `{{cidade}}`) são listadas como referência.

### Banco de Dados

Nova tabela `document_templates`:

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- 'autorizacao-imagem', 'integracao-voluntaria', etc.
  title TEXT NOT NULL, -- título exibido no documento
  header_line1 TEXT DEFAULT 'ASSOCIAÇÃO DE ASSISTÊNCIA SOCIAL E EDUCACIONAL',
  header_line2 TEXT DEFAULT 'O BOM SAMARITANO',
  header_address TEXT DEFAULT 'Rua Pastor José Vargas Maciel, s/n - Alto Forquilhas',
  header_city TEXT DEFAULT 'São José - Santa Catarina - CEP 88123-899',
  body_content TEXT NOT NULL, -- corpo do texto com placeholders {{nome}}, {{rg}}, {{cpf}}
  show_family_lines BOOLEAN DEFAULT false, -- para socialização que tem linhas de "Familiar Participante"
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Seed com os 4 templates atuais (textos hardcoded migrados para a tabela).

RLS: leitura para `authenticated`, escrita para admins.

### Arquivos Novos

1. **`src/hooks/use-document-templates.ts`** - hook para buscar e atualizar templates
2. **`src/pages/DocumentTemplates.tsx`** - página do editor com lista dos 4 templates e formulário de edição
3. **`src/components/documents/template-editor.tsx`** - componente do formulário de edição (textareas para cabeçalho, título, corpo)
4. **`src/components/documents/template-preview.tsx`** - preview A4 em tempo real do documento com dados fictícios
5. **`src/components/documents/generic-document-renderer.tsx`** - componente genérico que renderiza qualquer template com dados do aluno (substitui os 4 componentes hardcoded)

### Arquivos Modificados

1. **`src/App.tsx`** - nova rota `/configuracoes/templates-documentos`
2. **`src/components/navigation/sidebar.tsx`** - adicionar link no menu (dentro de Configurações ou como item próprio)
3. **`src/pages/StudentImageAuthorization.tsx`** (e os outros 3 pages de documentos) - buscar template do banco em vez de usar componente hardcoded; usar `GenericDocumentRenderer`

### Fluxo do Usuário

1. Acessa "Templates de Documentos" no menu
2. Vê os 4 documentos listados como cards
3. Clica em "Editar" em um deles
4. Edita título, cabeçalho, e corpo do texto em textareas
5. Vê um preview A4 em tempo real ao lado
6. Variáveis disponíveis são listadas como badges clicáveis (`{{nome}}`, `{{rg}}`, `{{cpf}}`, `{{data}}`, `{{cidade}}`)
7. Salva, e ao imprimir pelo cadastro do aluno o novo texto aparece

### Variáveis suportadas

| Variável | Valor |
|----------|-------|
| `{{nome}}` | Nome completo do aluno |
| `{{rg}}` | RG do aluno |
| `{{cpf}}` | CPF do aluno |
| `{{documento}}` | RG / CPF formatado |
| `{{data}}` | Data atual por extenso |
| `{{cidade}}` | Cidade padrão (São José - SC) |

