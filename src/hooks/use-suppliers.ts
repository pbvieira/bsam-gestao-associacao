import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface Supplier {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  tipo: string;
  cnpj: string | null;
  cpf: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  contato_responsavel: string | null;
  produtos_servicos: string[] | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useSuppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('ativo', true)
        .order('razao_social', { ascending: true });

      if (error) throw error;
      setSuppliers((data || []) as Supplier[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [user]);

  const createSupplier = async (supplierData: {
    razao_social: string;
    nome_fantasia?: string;
    tipo: string;
    cnpj?: string;
    cpf?: string;
    endereco?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    telefone?: string;
    email?: string;
    contato_responsavel?: string;
    produtos_servicos?: string[];
    observacoes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;
      await fetchSuppliers();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateSupplier = async (id: string, supplierData: Partial<Supplier>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchSuppliers();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deactivateSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      await fetchSuppliers();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const getActiveSuppliers = () => {
    return suppliers.filter(supplier => supplier.ativo);
  };

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier,
    getActiveSuppliers
  };
}