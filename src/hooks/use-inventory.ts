import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface InventoryItem {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  unidade_medida: string | null;
  estoque_minimo: number;
  estoque_atual: number;
  valor_unitario: number | null;
  origem: 'compra' | 'doacao';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  tipo_movimento: 'entrada' | 'saida';
  quantidade: number;
  valor_unitario: number | null;
  origem_movimento: 'compra' | 'doacao' | 'consumo' | 'perda' | 'ajuste';
  referencia_id: string | null;
  referencia_tipo: string | null;
  observacoes: string | null;
  data_movimento: string;
  created_by: string;
  created_at: string;
}

export function useInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      setItems((data || []) as InventoryItem[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (itemId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('inventory_movements')
        .select('*')
        .order('data_movimento', { ascending: false })
        .limit(50);

      if (itemId) {
        query = query.eq('inventory_item_id', itemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovements((data || []) as InventoryMovement[]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchMovements();
  }, [user]);

  const createItem = async (itemData: {
    nome: string;
    descricao?: string;
    categoria?: string;
    unidade_medida?: string;
    estoque_minimo?: number;
    valor_unitario?: number;
    origem: 'compra' | 'doacao';
  }) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;
      await fetchItems();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateItem = async (id: string, itemData: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
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

  const createMovement = async (movementData: {
    inventory_item_id: string;
    tipo_movimento: 'entrada' | 'saida';
    quantidade: number;
    valor_unitario?: number;
    origem_movimento: 'compra' | 'doacao' | 'consumo' | 'perda' | 'ajuste';
    referencia_id?: string;
    referencia_tipo?: string;
    observacoes?: string;
    data_movimento?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert([{ ...movementData, created_by: user?.id }])
        .select()
        .single();

      if (error) throw error;
      await fetchItems(); // Refresh to get updated stock
      await fetchMovements();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const getLowStockItems = () => {
    return items.filter(item => 
      item.estoque_atual <= item.estoque_minimo && item.estoque_minimo > 0
    );
  };

  const getTotalValue = () => {
    return items.reduce((total, item) => {
      return total + (item.estoque_atual * (item.valor_unitario || 0));
    }, 0);
  };

  return {
    items,
    movements,
    loading,
    error,
    fetchItems,
    fetchMovements,
    createItem,
    updateItem,
    createMovement,
    getLowStockItems,
    getTotalValue
  };
}