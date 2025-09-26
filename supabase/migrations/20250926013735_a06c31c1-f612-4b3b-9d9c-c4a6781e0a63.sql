-- Phase 3: Create ERP tables for Suppliers, Inventory and Purchases (Fixed)

-- Create sequence first
CREATE SEQUENCE purchase_orders_seq START 1;

-- Suppliers table
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text,
  cpf text,
  tipo text NOT NULL CHECK (tipo IN ('juridica', 'fisica')),
  endereco text,
  cep text,
  cidade text,
  estado text,
  telefone text,
  email text,
  contato_responsavel text,
  produtos_servicos text[],
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory items table
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  categoria text,
  unidade_medida text,
  estoque_minimo integer DEFAULT 0,
  estoque_atual integer DEFAULT 0,
  valor_unitario decimal(10,2),
  origem text NOT NULL CHECK (origem IN ('compra', 'doacao')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase orders table  
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo_pedido text UNIQUE NOT NULL DEFAULT 'PED-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('purchase_orders_seq')::text, 4, '0'),
  supplier_id uuid REFERENCES public.suppliers(id) NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recebido', 'cancelado')),
  data_pedido date NOT NULL DEFAULT CURRENT_DATE,
  data_aprovacao date,
  data_recebimento date,
  valor_total decimal(10,2) NOT NULL DEFAULT 0,
  observacoes text,
  created_by uuid REFERENCES auth.users NOT NULL,
  approved_by uuid REFERENCES auth.users,
  received_by uuid REFERENCES auth.users,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase order items table
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
  inventory_item_id uuid REFERENCES public.inventory_items(id),
  nome_item text NOT NULL,
  descricao text,
  quantidade integer NOT NULL,
  valor_unitario decimal(10,2) NOT NULL,
  valor_total decimal(10,2) NOT NULL,
  quantidade_recebida integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory movements table (for stock control)
CREATE TABLE public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id uuid REFERENCES public.inventory_items(id) NOT NULL,
  tipo_movimento text NOT NULL CHECK (tipo_movimento IN ('entrada', 'saida')),
  quantidade integer NOT NULL,
  valor_unitario decimal(10,2),
  origem_movimento text NOT NULL CHECK (origem_movimento IN ('compra', 'doacao', 'consumo', 'perda', 'ajuste')),
  referencia_id uuid, -- Can reference purchase_order_id, student_id, etc.
  referencia_tipo text, -- 'purchase_order', 'student', 'other'
  observacoes text,
  data_movimento date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Users can view suppliers based on permissions" ON public.suppliers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Coordinators and directors can manage suppliers" ON public.suppliers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view inventory items based on permissions" ON public.inventory_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Coordinators and directors can manage inventory items" ON public.inventory_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

-- RLS Policies for purchase_orders
CREATE POLICY "Users can view purchase orders based on permissions" ON public.purchase_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Users can create purchase orders" ON public.purchase_orders
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Users can update their own purchase orders" ON public.purchase_orders
FOR UPDATE USING (
  (created_by = auth.uid() AND status = 'pendente') OR
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor')
  )
);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();