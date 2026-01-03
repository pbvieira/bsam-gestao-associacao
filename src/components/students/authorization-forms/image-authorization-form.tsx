import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ImageAuthorizationFormProps {
  name: string;
  rg: string | null;
  cpf: string | null;
  date?: string;
  city?: string;
}

export function ImageAuthorizationForm({
  name,
  rg,
  cpf,
  date = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
  city = "São José - SC",
}: ImageAuthorizationFormProps) {
  const formatDocument = () => {
    const docs = [];
    if (rg) docs.push(rg);
    if (cpf) docs.push(cpf);
    return docs.length > 0 ? docs.join(" / ") : "_______________";
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8 print:bg-white print:py-0">
      {/* Botão de impressão flutuante */}
      <Button
        onClick={() => window.print()}
        className="fixed bottom-4 right-4 print:hidden z-50"
        size="lg"
      >
        <Printer className="mr-2 h-5 w-5" />
        Imprimir
      </Button>

      {/* Container A4 */}
      <div className="mx-auto max-w-[210mm] min-h-[297mm] bg-white p-12 shadow-lg print:shadow-none print:p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-lg font-bold uppercase tracking-wide">
            Associação de Assistência Social e Educacional
          </h1>
          <h2 className="font-serif text-xl font-bold uppercase tracking-wider mt-1">
            O Bom Samaritano
          </h2>
          <p className="font-serif text-sm mt-2 text-muted-foreground">
            Rua Pastor José Vargas Maciel, s/n - Alto Forquilhas
          </p>
          <p className="font-serif text-sm text-muted-foreground">
            São José - Santa Catarina - CEP 88123-899
          </p>
          <div className="border-t border-foreground/30 mt-4 w-full" />
        </div>

        {/* Título */}
        <div className="text-center mt-12 mb-10">
          <h3 className="font-serif text-base font-bold uppercase tracking-widest">
            Autorização de Uso de Imagem e Voz
          </h3>
        </div>

        {/* Corpo do texto */}
        <div className="font-serif text-sm leading-relaxed text-justify space-y-6">
          <p className="indent-8">
            <strong>{name || "_______________"}</strong> Portador do RG/CPF{" "}
            <strong>{formatDocument()}</strong> neste ato denominado Cedente, autorizo a
            Associação de Assistência Social e Educacional "O Bom Samaritano", aqui
            denominada Cessionária, a utilizar-se de todos e quaisquer direitos de uso de
            imagem e voz, decorrentes da minha participação em quaisquer eventos ou
            entrevistas realizados por esta instituição, produzidos para fins profissionais
            ou não, podendo ser veiculado em emissora de Rádio, TV, Internet, dispositivos
            móveis, telefonia móvel, impressos ou qualquer veículo midiático que venha ser
            criado. Autorizo também a gravação e distribuição, em qualquer quantidade e a
            qualquer tempo, em BluRay, DVD, CD ou via Download, para fins comerciais, cuja
            renda seja revertida à manutenção do trabalho assistencial e social da
            Cessionária.
          </p>

          <p className="indent-8">
            Fica acordado que todas as referências que se fizerem a mim serão sempre
            extensivas à minha pessoa física, meu nome, completo ou não, pseudônimos e/ou
            sinais convencionais. A cedente autoriza expressamente a Cessionária a executar
            livremente a edição e montagem de músicas ou preleções, podendo proceder cortes,
            fixações e reproduções que entender necessárias.
          </p>

          <p className="indent-8">
            A presente autorização é firmada em caráter exclusivo, gratuito, irrevogável e
            irretratável, não incorrendo a Cessionária em qualquer custo ou ônus, seja a que
            título for, obrigado o cedente por si e seus herdeiros por tempo indeterminado.
          </p>
        </div>

        {/* Rodapé / Assinatura */}
        <div className="mt-24 text-right font-serif text-sm">
          <p>{city}, {date}</p>
        </div>

        <div className="mt-20 flex flex-col items-center">
          <div className="w-64 border-t border-foreground pt-2 text-center">
            <p className="font-serif text-sm">{name || "_______________"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
