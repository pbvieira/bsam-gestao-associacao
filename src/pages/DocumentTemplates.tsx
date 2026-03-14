import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Pencil } from 'lucide-react';
import { useDocumentTemplates, type DocumentTemplate } from '@/hooks/use-document-templates';
import { TemplateEditor } from '@/components/documents/template-editor';

const SLUG_LABELS: Record<string, string> = {
  'autorizacao-imagem': 'Autorização de Imagem',
  'integracao-voluntaria': 'Integração Voluntária',
  'participacao-socializacao': 'Participação na Socialização',
  'termo-responsabilidade': 'Termo de Responsabilidade',
};

export default function DocumentTemplates() {
  const { data: templates, isLoading } = useDocumentTemplates();
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);

  if (editing) {
    return (
      <MainLayout>
        <PageLayout
          title={`Editar: ${editing.title}`}
          subtitle="Edite o conteúdo do documento"
        >
          <TemplateEditor template={editing} onBack={() => setEditing(null)} />
        </PageLayout>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageLayout
        title="Templates de Documentos"
        subtitle="Edite o conteúdo dos documentos legais impressos pelo cadastro do aluno"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates?.map(template => (
              <Card key={template.id} className="group hover:shadow-md hover:border-primary/50 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-medium">{template.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {SLUG_LABELS[template.slug] || template.slug}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(template)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.body_content.substring(0, 150)}...
                  </p>
                  <div className="flex gap-2 mt-3">
                    {template.show_family_lines && (
                      <Badge variant="secondary" className="text-xs">
                        Linhas familiares
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </PageLayout>
    </MainLayout>
  );
}
