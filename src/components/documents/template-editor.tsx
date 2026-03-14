import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Save, Eye, ArrowLeft } from 'lucide-react';
import { type DocumentTemplate, useUpdateDocumentTemplate } from '@/hooks/use-document-templates';
import { TemplatePreview } from './template-preview';

interface TemplateEditorProps {
  template: DocumentTemplate;
  onBack: () => void;
}

const AVAILABLE_VARIABLES = [
  { key: '{{nome}}', label: 'Nome do aluno' },
  { key: '{{rg}}', label: 'RG' },
  { key: '{{cpf}}', label: 'CPF' },
  { key: '{{documento}}', label: 'RG / CPF' },
  { key: '{{data}}', label: 'Data atual' },
  { key: '{{cidade}}', label: 'Cidade' },
];

export function TemplateEditor({ template, onBack }: TemplateEditorProps) {
  const [form, setForm] = useState({
    title: template.title,
    header_line1: template.header_line1,
    header_line2: template.header_line2,
    header_address: template.header_address,
    header_city: template.header_city,
    body_content: template.body_content,
    show_family_lines: template.show_family_lines,
    family_lines_count: template.family_lines_count,
  });
  const [showPreview, setShowPreview] = useState(false);

  const updateMutation = useUpdateDocumentTemplate();

  useEffect(() => {
    setForm({
      title: template.title,
      header_line1: template.header_line1,
      header_line2: template.header_line2,
      header_address: template.header_address,
      header_city: template.header_city,
      body_content: template.body_content,
      show_family_lines: template.show_family_lines,
      family_lines_count: template.family_lines_count,
    });
  }, [template]);

  const handleSave = () => {
    updateMutation.mutate({ id: template.id, updates: form });
  };

  const insertVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      body_content: prev.body_content + variable,
    }));
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowPreview(false)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao editor
        </Button>
        <TemplatePreview template={{ ...template, ...form }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Header fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cabeçalho do Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Linha 1</Label>
              <Input
                value={form.header_line1}
                onChange={e => setForm(p => ({ ...p, header_line1: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Linha 2</Label>
              <Input
                value={form.header_line2}
                onChange={e => setForm(p => ({ ...p, header_line2: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={form.header_address}
                onChange={e => setForm(p => ({ ...p, header_address: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade / CEP</Label>
              <Input
                value={form.header_city}
                onChange={e => setForm(p => ({ ...p, header_city: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Título do Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* Body */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Corpo do Texto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Variáveis disponíveis (clique para inserir):
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_VARIABLES.map(v => (
                <Badge
                  key={v.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => insertVariable(v.key)}
                >
                  {v.key} — {v.label}
                </Badge>
              ))}
            </div>
          </div>
          <Textarea
            value={form.body_content}
            onChange={e => setForm(p => ({ ...p, body_content: e.target.value }))}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Use {{nome}}, {{documento}}, etc. para inserir dados do aluno. Separe parágrafos com uma linha em branco."
          />
          <p className="text-xs text-muted-foreground">
            Separe parágrafos com uma linha em branco (dois enters). As variáveis serão substituídas pelos dados do aluno na impressão.
          </p>
        </CardContent>
      </Card>

      {/* Family lines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opções Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.show_family_lines}
              onCheckedChange={v => setForm(p => ({ ...p, show_family_lines: v }))}
            />
            <Label>Exibir linhas para "Familiar Participante"</Label>
          </div>
          {form.show_family_lines && (
            <div className="space-y-2 ml-12">
              <Label>Quantidade de linhas</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.family_lines_count}
                onChange={e => setForm(p => ({ ...p, family_lines_count: parseInt(e.target.value) || 6 }))}
                className="w-24"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
