import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

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

export function usePurchaseItems(purchaseOrderId?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!user || !purchaseOrderId) return;
    
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('nome_item', { ascending: true });

      if (error) throw error;
      setItems((data || []) as PurchaseOrderItem[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (purchaseOrderId) {
      fetchItems();
    }
  }, [user, purchaseOrderId]);

  const addItem = async (itemData: {
    purchase_order_id: string;
    inventory_item_id?: string;
    nome_item: string;
    descricao?: string;
    quantidade: number;
    valor_unitario: number;
  }) => {
    try {
      const valor_total = itemData.quantidade * itemData.valor_unitario;
      
      const { data, error } = await supabase
        .from('purchase_order_items')
        .insert([{ ...itemData, valor_total }])
        .select()
        .single();

      if (error) throw error;
      await fetchItems();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, itemData: Partial<PurchaseOrderItem>) => {
    try {
      // Calculate valor_total if quantidade or valor_unitario changed
      if (itemData.quantidade || itemData.valor_unitario) {
        const currentItem = items.find(item => item.id === id);
        if (currentItem) {
          const quantidade = itemData.quantidade ?? currentItem.quantidade;
          const valor_unitario = itemData.valor_unitario ?? currentItem.valor_unitario;
          itemData.valor_total = quantidade * valor_unitario;
        }
      }

      const { data, error } = await supabase
        .from('purchase_order_items')
        .update(itemData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchItems();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchase_order_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchItems();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const receiveItem = async (id: string, quantidadeRecebida: number) => {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .update({ quantidade_recebida: quantidadeRecebida })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchItems();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => total + item.valor_total, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantidade, 0);
  };

  const getReceivedItems = () => {
    return items.filter(item => item.quantidade_recebida > 0);
  };

  const getPendingItems = () => {
    return items.filter(item => item.quantidade_recebida < item.quantidade);
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    removeItem,
    receiveItem,
    getTotalValue,
    getTotalItems,
    getReceivedItems,
    getPendingItems
  };
}