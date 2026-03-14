
-- Create document_templates table
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  header_line1 TEXT DEFAULT 'ASSOCIAÇÃO DE ASSISTÊNCIA SOCIAL E EDUCACIONAL',
  header_line2 TEXT DEFAULT 'O BOM SAMARITANO',
  header_address TEXT DEFAULT 'Rua Pastor José Vargas Maciel, s/n - Alto Forquilhas',
  header_city TEXT DEFAULT 'São José - Santa Catarina - CEP 88123-899',
  body_content TEXT NOT NULL,
  show_family_lines BOOLEAN DEFAULT false,
  family_lines_count INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read templates
CREATE POLICY "Authenticated users can view templates"
  ON public.document_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage templates
CREATE POLICY "Admins can manage templates"
  ON public.document_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('coordenador', 'diretor', 'administrador')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 4 templates
INSERT INTO public.document_templates (slug, title, body_content, show_family_lines) VALUES
(
  'autorizacao-imagem',
  'Autorização de Uso de Imagem e Voz',
  E'{{nome}} Portador do RG/CPF {{documento}} neste ato denominado Cedente, autorizo a Associação de Assistência Social e Educacional "O Bom Samaritano", aqui denominada Cessionária, a utilizar-se de todos e quaisquer direitos de uso de imagem e voz, decorrentes da minha participação em quaisquer eventos ou entrevistas realizados por esta instituição, produzidos para fins profissionais ou não, podendo ser veiculado em emissora de Rádio, TV, Internet, dispositivos móveis, telefonia móvel, impressos ou qualquer veículo midiático que venha ser criado. Autorizo também a gravação e distribuição, em qualquer quantidade e a qualquer tempo, em BluRay, DVD, CD ou via Download, para fins comerciais, cuja renda seja revertida à manutenção do trabalho assistencial e social da Cessionária.\n\nFica acordado que todas as referências que se fizerem a mim serão sempre extensivas à minha pessoa física, meu nome, completo ou não, pseudônimos e/ou sinais convencionais. A cedente autoriza expressamente a Cessionária a executar livremente a edição e montagem de músicas ou preleções, podendo proceder cortes, fixações e reproduções que entender necessárias.\n\nA presente autorização é firmada em caráter exclusivo, gratuito, irrevogável e irretratável, não incorrendo a Cessionária em qualquer custo ou ônus, seja a que título for, obrigado o cedente por si e seus herdeiros por tempo indeterminado.',
  false
),
(
  'integracao-voluntaria',
  'Declaração de Integração e Permanência Voluntária',
  E'{{nome}} Portador do RG/CPF {{documento}} venho por meio desta declarar que meu ingresso e minha permanência na Associação de Assistência Social e Educacional "O Bom Samaritano", é inteiramente voluntária e tenho plena ciência das normas internas e estou inteiramente de acordo.',
  false
),
(
  'participacao-socializacao',
  'Declaração de Participação na Socialização',
  E'{{nome}} Portador do RG/CPF {{documento}} declaro que participei do programa de socialização sendo orientado das normas e procedimentos da Associação de Assistência Social e Educacional "O Bom Samaritano", e estou de acordo e ciente que o não cumprimento do regimento interno pode acarretar no meu desligamento.',
  true
),
(
  'termo-responsabilidade',
  'Termo de Responsabilidade',
  E'{{nome}} Portador do RG/CPF {{documento}} Declaro estar ciente de que sou plenamente responsável pelos meus pertences pessoais e isento a instituição na qual estou acolhido de qualquer responsabilidade por eventuais prejuízos que venham a ocorrer. Também declaro estar ciente de que, em caso de desligamento, devo retirar imediatamente todos os meus pertences, pois caso não sejam retirados estarei disponibilizando-os para doação.',
  false
);
