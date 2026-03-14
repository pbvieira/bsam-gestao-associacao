import { type DocumentTemplate } from '@/hooks/use-document-templates';
import logoObs from '@/assets/logo-obs.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TemplatePreviewProps {
  template: Partial<DocumentTemplate> & Pick<DocumentTemplate, 'title' | 'body_content'>;
}

const SAMPLE_DATA: Record<string, string> = {
  nome: 'João da Silva Santos',
  rg: '1.234.567-8',
  cpf: '123.456.789-00',
  documento: '1.234.567-8 / 123.456.789-00',
  data: format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
  cidade: 'São José - SC',
};

function replaceVariables(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_DATA[key] || `{{${key}}}`);
}

export function TemplatePreview({ template }: TemplatePreviewProps) {
  const processedBody = replaceVariables(template.body_content);
  const paragraphs = processedBody.split('\n\n').filter(Boolean);

  return (
    <div className="flex justify-center">
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-lg border rounded-sm" style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="font-serif font-bold text-base text-foreground leading-tight">
            {template.header_line1 || 'ASSOCIAÇÃO DE ASSISTÊNCIA SOCIAL E EDUCACIONAL'}
          </h1>
          <h2 className="font-serif font-bold text-lg text-foreground mt-1">
            {template.header_line2 || 'O BOM SAMARITANO'}
          </h2>
          <p className="font-serif text-sm text-muted-foreground mt-2">
            {template.header_address || 'Rua Pastor José Vargas Maciel, s/n - Alto Forquilhas'}
          </p>
          <p className="font-serif text-sm text-muted-foreground">
            {template.header_city || 'São José - Santa Catarina - CEP 88123-899'}
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
            <p key={i} className="indent-8">{paragraph}</p>
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
          <p>{SAMPLE_DATA.cidade}, {SAMPLE_DATA.data}</p>
        </div>
        <div className="mt-20 flex flex-col items-center">
          <div className="w-64 border-t border-foreground pt-2 text-center">
            <p className="font-serif text-sm text-foreground">{SAMPLE_DATA.nome}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
