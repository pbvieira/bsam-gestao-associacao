import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface VaccinationQueueItem {
  id: string;
  student_id: string;
  vaccine_type_id: string;
  trip_id: string | null;
  status: string;
  added_by: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  student?: { id: string; nome_completo: string; codigo_cadastro: string };
  vaccine_type?: { id: string; nome: string; cor: string };
}

export function useVaccinationQueue(studentId?: string) {
  const { user } = useAuth();
  const [items, setItems] = useState<VaccinationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('vaccination_queue')
      .select(`
        *,
        student:students(id, nome_completo, codigo_cadastro),
        vaccine_type:vaccine_types(id, nome, cor)
      `)
      .order('created_at', { ascending: true });
    if (studentId) query = query.eq('student_id', studentId);
    const { data, error } = await query;
    if (!error) setItems((data as any) || []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel('vaccination-queue-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vaccination_queue' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const addToQueue = async (input: { student_id: string; vaccine_type_id: string; observacoes?: string }) => {
    if (!user) return { error: 'Não autenticado' };
    const { data, error } = await supabase
      .from('vaccination_queue')
      .insert({
        student_id: input.student_id,
        vaccine_type_id: input.vaccine_type_id,
        added_by: user.id,
        observacoes: input.observacoes || null,
        status: 'pendente',
      })
      .select()
      .single();
    if (error) return { error: error.message };
    await fetch();
    return { data };
  };

  const removeFromQueue = async (id: string) => {
    const { error } = await supabase.from('vaccination_queue').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetch();
    return { success: true };
  };

  return { items, loading, refetch: fetch, addToQueue, removeFromQueue };
}
