import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface CashBookTransaction {
  id: string;
  student_id: string;
  tipo_movimento: 'entrada' | 'saida';
  categoria: string;
  descricao: string | null;
  valor: number;
  data_movimento: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useStudentCashBook(studentId?: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CashBookTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user || !studentId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_cash_book')
        .select('*')
        .eq('student_id', studentId)
        .order('data_movimento', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data || []) as CashBookTransaction[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, studentId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (data: {
    tipo_movimento: 'entrada' | 'saida';
    categoria: string;
    descricao?: string;
    valor: number;
    data_movimento: string;
  }) => {
    if (!studentId || !user) return { error: 'Dados insuficientes' };

    try {
      const { data: result, error } = await supabase
        .from('student_cash_book')
        .insert([{
          student_id: studentId,
          tipo_movimento: data.tipo_movimento,
          categoria: data.categoria,
          descricao: data.descricao || null,
          valor: data.valor,
          data_movimento: data.data_movimento,
          created_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchTransactions();
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const updateTransaction = async (id: string, data: {
    tipo_movimento?: 'entrada' | 'saida';
    categoria?: string;
    descricao?: string;
    valor?: number;
    data_movimento?: string;
  }) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { data: result, error } = await supabase
        .from('student_cash_book')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchTransactions();
      return { data: result, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('student_cash_book')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchTransactions();
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const totalEntradas = transactions
    .filter(t => t.tipo_movimento === 'entrada')
    .reduce((sum, t) => sum + (t.valor || 0), 0);

  const totalSaidas = transactions
    .filter(t => t.tipo_movimento === 'saida')
    .reduce((sum, t) => sum + (t.valor || 0), 0);

  const saldoAtual = totalEntradas - totalSaidas;

  return {
    transactions,
    loading,
    error,
    totalEntradas,
    totalSaidas,
    saldoAtual,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
