-- Fix missing RLS policies for purchase_order_items and inventory_movements

-- RLS Policies for purchase_order_items
CREATE POLICY "Users can view purchase order items based on order permissions" ON public.purchase_order_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.purchase_orders po
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE po.id = purchase_order_items.purchase_order_id
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Users can manage purchase order items based on order permissions" ON public.purchase_order_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.purchase_orders po
    JOIN public.profiles p ON (p.user_id = auth.uid())
    WHERE po.id = purchase_order_items.purchase_order_id
    AND (
      (po.created_by = auth.uid() AND po.status = 'pendente') OR
      p.role IN ('coordenador', 'diretor')
    )
  )
);

-- RLS Policies for inventory_movements
CREATE POLICY "Users can view inventory movements based on permissions" ON public.inventory_movements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

CREATE POLICY "Users can create inventory movements" ON public.inventory_movements
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() 
    AND p.role IN ('coordenador', 'diretor', 'auxiliar')
  )
);

-- Function to update inventory stock automatically
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_movimento = 'entrada' THEN
    UPDATE public.inventory_items
    SET estoque_atual = estoque_atual + NEW.quantidade
    WHERE id = NEW.inventory_item_id;
  ELSIF NEW.tipo_movimento = 'saida' THEN
    UPDATE public.inventory_items
    SET estoque_atual = estoque_atual - NEW.quantidade
    WHERE id = NEW.inventory_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update stock on inventory movements
CREATE TRIGGER trigger_update_inventory_stock
AFTER INSERT ON public.inventory_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_inventory_stock();