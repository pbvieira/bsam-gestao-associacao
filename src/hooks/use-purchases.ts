import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface PurchaseOrder {
  id: string;
  codigo_pedido: string;
  supplier_id: string;
  data_pedido: string;
  status: string;
  valor_total: number;
  observacoes: string | null;
  created_by: string;
  approved_by: string | null;
  received_by: string | null;
  data_aprovacao: string | null;
  data_recebimento: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  inventory_item_id: string | null;
  nome_item: string;
  descricao: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  quantidade_recebida: number;
  created_at: string;
}

export function usePurchases() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as PurchaseOrder[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const createOrder = async (orderData: {
    supplier_id: string;
    data_pedido: string;
    observacoes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert([{ ...orderData, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      await fetchOrders();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateOrder = async (id: string, orderData: Partial<PurchaseOrder>) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(orderData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchOrders();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const approveOrder = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'aprovado',
          approved_by: user?.id,
          data_aprovacao: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchOrders();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const receiveOrder = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'recebido',
          received_by: user?.id,
          data_recebimento: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchOrders();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getPendingOrders = () => {
    return orders.filter(order => order.status === 'pendente');
  };

  const getApprovedOrders = () => {
    return orders.filter(order => order.status === 'aprovado');
  };

  const getTotalValue = () => {
    return orders.reduce((total, order) => total + order.valor_total, 0);
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    updateOrder,
    approveOrder,
    receiveOrder,
    getPendingOrders,
    getApprovedOrders,
    getTotalValue
  };
}