import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface VoluntaryIntegrationFormProps {
  name: string;
  rg: string | null;
  cpf: string | null;
  date?: string;
  city?: string;
}

export function VoluntaryIntegrationForm({
  name,
  rg,
  cpf,
  date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  city = 'São José - SC'
}: VoluntaryIntegrationFormProps) {
  const handlePrint = () => {
    window.print();
  };

  const formatDocument = () => {
    const docs = [];
    if (rg) docs.push(rg);
    if (cpf) docs.push(cpf);
    return docs.join(' / ') || 'Não informado';
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      {/* Floating Print Button */}
      <Button
        onClick={handlePrint}
        className="fixed bottom-4 right-4 print:hidden z-50"
        size="lg"
      >
        <Printer className="h-5 w-5 mr-2" />
        Imprimir
      </Button>

      {/* A4 Document Container */}
      <div className="min-h-screen bg-muted print:bg-white print:min-h-0 py-8 print:py-0 flex justify-center">
        <div className="print-container bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-lg print:shadow-none mx-4 print:mx-0">
          
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="font-serif font-bold text-base text-black leading-tight">
              ASSOCIAÇÃO DE ASSISTÊNCIA SOCIAL E EDUCACIONAL
            </h1>
            <h2 className="font-serif font-bold text-lg text-black mt-1">
              O BOM SAMARITANO
            </h2>
            <p className="font-serif text-sm text-black mt-2">
              Rua Pastor José Vargas Maciel, s/n - Alto Forquilhas
            </p>
            <p className="font-serif text-sm text-black">
              São José - Santa Catarina - CEP 88123-899
            </p>
            <div className="border-t border-black/30 mt-4 w-full"></div>
          </header>

          {/* Title */}
          <div className="text-center mt-16 mb-12">
            <h3 className="font-serif font-bold text-base text-black uppercase tracking-wide">
              DECLARAÇÃO DE INTEGRAÇÃO E PERMANÊNCIA VOLUNTÁRIA
            </h3>
          </div>

          {/* Body Text */}
          <div className="font-serif text-sm text-black text-justify leading-relaxed space-y-6 mt-8">
            <p className="indent-8">
              <strong>{name}</strong> Portador do RG/CPF <strong>{formatDocument()}</strong> venho 
              por meio desta declarar que meu ingresso e minha permanência na Associação de 
              Assistência Social e Educacional "O Bom Samaritano", é inteiramente voluntária e 
              tenho plena ciência das normas internas e estou inteiramente de acordo.
            </p>
          </div>

          {/* Signature Section */}
          <div className="mt-32 text-right font-serif text-sm text-black">
            <p>{city}, {date}</p>
            
            <div className="mt-24 flex flex-col items-center">
              <div className="w-64 border-t border-black"></div>
              <p className="mt-2 text-center">{name}</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
