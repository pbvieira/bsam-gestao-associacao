interface ResponsibilityTermFormProps {
  name: string;
  rg: string;
  cpf: string;
  date: string;
  city: string;
}

export function ResponsibilityTermForm({ name, rg, cpf, date, city }: ResponsibilityTermFormProps) {
  const handlePrint = () => {
    window.print();
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
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .print-container {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              max-width: none !important;
              min-height: auto !important;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-muted p-4 print:bg-white print:p-0 print:min-h-0">
        <div className="print-container max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg p-12 print:shadow-none print:p-0">
          {/* Cabeçalho */}
          <header className="text-center mb-8">
            <h1 className="font-serif text-lg font-bold text-black leading-tight">
              ASSOCIAÇÃO DE ASSISTÊNCIA SOCIAL E EDUCACIONAL
            </h1>
            <h2 className="font-serif text-lg font-bold text-black">
              O BOM SAMARITANO
            </h2>
            <p className="font-serif text-sm text-black mt-2">
              Rua Pastor José Vargas Maciel, s/n - Alto Forquilhas
            </p>
            <p className="font-serif text-sm text-black">
              São José - Santa Catarina - CEP 88123-899
            </p>
            <div className="mt-4 border-t border-black/20" />
          </header>

          {/* Título */}
          <h3 className="text-center font-serif text-base font-bold text-black uppercase mt-12 mb-10">
            TERMO DE RESPONSABILIDADE
          </h3>

          {/* Corpo do Texto */}
          <div className="text-justify font-serif text-sm text-black leading-relaxed px-4">
            <p className="indent-8">
              <strong>{name}</strong> Portador do RG/CPF <strong>{rg}</strong> <strong>{cpf}</strong> Declaro 
              estar ciente de que sou plenamente responsável pelos meus pertences pessoais e isento a 
              instituição na qual estou acolhido de qualquer responsabilidade por eventuais prejuízos 
              que venham a ocorrer. Também declaro estar ciente de que, em caso de desligamento, devo 
              retirar imediatamente todos os meus pertences, pois caso não sejam retirados estarei 
              disponibilizando-os para doação.
            </p>
          </div>

          {/* Rodapé / Assinatura */}
          <footer className="mt-32 px-4">
            <div className="text-right mb-16">
              <p className="font-serif text-sm text-black">
                {city}, {date}
              </p>
            </div>

            <div className="flex flex-col items-center mt-20">
              <div className="w-72 border-t border-black" />
              <p className="font-serif text-sm text-black mt-2 text-center">
                {name}
              </p>
            </div>
          </footer>
        </div>

        {/* Botão de Impressão */}
        <button
          onClick={handlePrint}
          className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition-colors print:hidden"
        >
          Imprimir
        </button>
      </div>
    </>
  );
}
