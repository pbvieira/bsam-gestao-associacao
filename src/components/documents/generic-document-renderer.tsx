import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, Save } from 'lucide-react';
import { useDocumentTemplate, type DocumentTemplate } from '@/hooks/use-document-templates';
import { SignaturePad } from './signature-pad';
import { useStudentDocuments } from '@/hooks/use-student-documents';
import { useToast } from '@/hooks/use-toast';
import logoObs from '@/assets/logo-obs.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface GenericDocumentRendererProps {
  slug: string;
  name: string;
  rg: string | null;
  cpf: string | null;
  city?: string;
  date?: string;
  studentId?: string;
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

function DocumentContent({
  template,
  variables,
  studentId,
}: {
  template: DocumentTemplate;
  variables: Record<string, string>;
  studentId?: string;
}) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isStoring, setIsStoring] = useState(false);
  const { uploadDocument } = useStudentDocuments(studentId);
  const { toast } = useToast();

  const processedBody = replaceVariables(template.body_content, variables);
  const paragraphs = processedBody.split('\n\n').filter(Boolean);

  const isSigned = !!signatureDataUrl;
  const canStore = isSigned && !!studentId;

  const handleStore = async () => {
    if (!canStore) return;
    setIsStoring(true);

    try {
      // Step 1: Capture DOM
      const container = document.querySelector('.print-container') as HTMLElement;
      if (!container) throw new Error('Container não encontrado');

      console.log('[Armazenar] Capturando DOM...');
      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        });
      } catch (canvasErr) {
        console.warn('[Armazenar] html2canvas falhou com CORS, tentando sem...', canvasErr);
        canvas = await html2canvas(container, {
          scale: 2,
          backgroundColor: '#ffffff',
        });
      }

      // Step 2: Generate PDF
      console.log('[Armazenar] Gerando PDF...');
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = 297;
      let position = 0;

      if (pdfHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      } else {
        let remainingHeight = pdfHeight;
        while (remainingHeight > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
          remainingHeight -= pageHeight;
          position -= pageHeight;
          if (remainingHeight > 0) pdf.addPage();
        }
      }

      // Step 3: Upload
      console.log('[Armazenar] Fazendo upload...');
      const pdfBlob = pdf.output('blob');
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const fileName = `${template.title} - ${variables.nome} - ${dateStr}.pdf`;

      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const result = await uploadDocument(file, 'documentos_assinados', fileName);

      if (result?.error) {
        throw new Error(result.error);
      }

      console.log('[Armazenar] Sucesso!');
      toast({
        title: 'Documento armazenado',
        description: 'O documento assinado foi salvo com sucesso na aba Documentos do aluno.',
      });
    } catch (error: any) {
      console.error('[Armazenar] Erro:', error);
      toast({
        title: 'Erro ao armazenar',
        description: error.message || 'Não foi possível salvar o documento.',
        variant: 'destructive',
      });
    } finally {
      setIsStoring(false);
    }
  };

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

      <div className="fixed bottom-4 right-4 print:hidden z-50 flex gap-2">
        {canStore && (
          <Button
            onClick={handleStore}
            disabled={isStoring}
            size="lg"
            variant="outline"
            className="bg-background"
          >
            {isStoring ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Armazenar
          </Button>
        )}
        <Button onClick={() => window.print()} size="lg">
          <Printer className="h-5 w-5 mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="min-h-screen bg-muted print:bg-white print:min-h-0 py-8 print:py-0 flex justify-center">
        <div className="print-container bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-lg print:shadow-none mx-4 print:mx-0">
          {/* Header */}
          <header className="text-center mb-8">
            <img src={logoObs} alt="Logo" className="mx-auto mb-4 w-[120px]" />
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

          <SignaturePad name={variables.nome} onSignatureChange={setSignatureDataUrl} />
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
  studentId,
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

  return <DocumentContent template={template} variables={variables} studentId={studentId} />;
}
