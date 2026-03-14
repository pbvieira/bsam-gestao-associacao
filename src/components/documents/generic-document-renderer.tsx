import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { useDocumentTemplate, type DocumentTemplate } from '@/hooks/use-document-templates';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GenericDocumentRendererProps {
  slug: string;
  name: string;
  rg: string | null;
  cpf: string | null;
  city?: string;
  date?: string;
}

function replaceVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

function formatDocument(rg: string | null, cpf: string | null): string {
  const docs = [];
  if (rg) docs.push(rg);
  if (cpf) docs.push(cpf);
  return docs.length > 0 ? docs.join(' / ') : 'Não informado';
}

function DocumentContent({ template, variables }: { template: DocumentTemplate; variables: Record<string, string> }) {
  const processedBody = replaceVariables(template.body_content, variables);
  const paragraphs = processedBody.split('\n\n').filter(Boolean);

  return (
    <>
      <style>
        {`
          @media print {
            @page { size: A4; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-container { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
          }
        `}
      </style>

      <Button
        onClick={() => window.print()}
        className="fixed bottom-4 right-4 print:hidden z-50"
        size="lg"
      >
        <Printer className="h-5 w-5 mr-2" />
        Imprimir
      </Button>

      <div className="min-h-screen bg-muted print:bg-white print:min-h-0 py-8 print:py-0 flex justify-center">
        <div className="print-container bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-lg print:shadow-none mx-4 print:mx-0">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="font-serif font-bold text-base text-foreground leading-tight">
              {template.header_line1}
            </h1>
            <h2 className="font-serif font-bold text-lg text-foreground mt-1">
              {template.header_line2}
            </h2>
            <p className="font-serif text-sm text-muted-foreground mt-2">
              {template.header_address}
            </p>
            <p className="font-serif text-sm text-muted-foreground">
              {template.header_city}
            </p>
            <div className="border-t border-foreground/30 mt-4 w-full" />
          </header>

          {/* Title */}
          <div className="text-center mt-12 mb-10">
            <h3 className="font-serif font-bold text-base text-foreground uppercase tracking-widest">
              {template.title}
            </h3>
          </div>

          {/* Body */}
          <div className="font-serif text-sm text-foreground text-justify leading-relaxed space-y-6 mt-8">
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="indent-8" dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
          </div>

          {/* Family Lines */}
          {template.show_family_lines && (
            <div className="mt-12">
              <p className="font-serif text-sm text-foreground mb-4">Familiar Participante:</p>
              <div className="space-y-8">
                {[...Array(template.family_lines_count || 6)].map((_, i) => (
                  <div key={i} className="h-8 border-b border-foreground" />
                ))}
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="mt-24 text-right font-serif text-sm text-foreground">
            <p>{variables.cidade}, {variables.data}</p>
          </div>

          <div className="mt-20 flex flex-col items-center">
            <div className="w-64 border-t border-foreground pt-2 text-center">
              <p className="font-serif text-sm text-foreground">{variables.nome}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function GenericDocumentRenderer({
  slug,
  name,
  rg,
  cpf,
  city = 'São José - SC',
  date = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
}: GenericDocumentRendererProps) {
  const { data: template, isLoading, error } = useDocumentTemplate(slug);

  const variables: Record<string, string> = {
    nome: name || '_______________',
    rg: rg || '_______________',
    cpf: cpf || '_______________',
    documento: formatDocument(rg, cpf),
    data: date,
    cidade: city,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Erro ao carregar o template do documento.</p>
      </div>
    );
  }

  return <DocumentContent template={template} variables={variables} />;
}
