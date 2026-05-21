import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';

export interface VaccinationTrip {
  id: string;
  vaccine_type_id: string;
  data_prevista: string | null;
  data_realizada: string | null;
  setor_id: string | null;
  responsavel_id: string | null;
  task_id: string | null;
  status: string;
  observacoes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  vaccine_type?: { id: string; nome: string; cor: string };
  setor?: { id: string; nome: string } | null;
  responsavel?: { full_name: string } | null;
  queue_items?: Array<{
    id: string;
    student_id: string;
    student?: { id: string; nome_completo: string; codigo_cadastro: string };
  }>;
}

export interface ScheduleTripInput {
  vaccine_type_id: string;
  queue_item_ids: string[];
  data_prevista?: string | null;
  setor_id?: string | null;
  responsavel_id?: string | null;
  observacoes?: string | null;
  vaccine_name: string;
  student_count: number;
  student_names: string[];
}

export interface CompleteTripInput {
  trip_id: string;
  data_vacinacao: string;
  results: Array<{ queue_item_id: string; student_id: string; vaccine_type_id: string; vacinado: boolean; motivo?: string }>;
}

export function useVaccinationTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<VaccinationTrip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vaccination_trips')
      .select(`
        *,
        vaccine_type:vaccine_types(id, nome, cor),
        setor:setores(id, nome),
        responsavel:profiles!vaccination_trips_responsavel_id_fkey(full_name),
        queue_items:vaccination_queue(id, student_id, student:students(id, nome_completo, codigo_cadastro))
      `)
      .order('created_at', { ascending: false });
    if (!error) setTrips((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase
      .channel('vaccination-trips-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vaccination_trips' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const scheduleTrip = async (input: ScheduleTripInput) => {
    if (!user) return { error: 'Não autenticado' };

    // 1. Create trip
    const { data: trip, error: tripErr } = await supabase
      .from('vaccination_trips')
      .insert({
        vaccine_type_id: input.vaccine_type_id,
        data_prevista: input.data_prevista || null,
        setor_id: input.setor_id || null,
        responsavel_id: input.responsavel_id || null,
        observacoes: input.observacoes || null,
        status: 'agendada',
        created_by: user.id,
      })
      .select()
      .single();
    if (tripErr || !trip) return { error: tripErr?.message || 'Falha ao criar' };

    // 2. Create task
    const descricao = `Vacinação em grupo (${input.vaccine_name}) para ${input.student_count} aluno(s):\n` +
      input.student_names.map(n => `- ${n}`).join('\n') +
      (input.observacoes ? `\n\nObservações: ${input.observacoes}` : '');

    const { data: task, error: taskErr } = await supabase
      .from('tasks')
      .insert({
        titulo: `Vacinação: ${input.vaccine_name} (${input.student_count} aluno${input.student_count > 1 ? 's' : ''})`,
        descricao,
        prioridade: 'media',
        status: 'pendente',
        categoria: 'Saúde',
        data_vencimento: input.data_prevista || null,
        created_by: user.id,
        assigned_to: input.responsavel_id || user.id,
        setor_id: input.setor_id || null,
        reference_type: 'vaccination_trip',
        reference_id: trip.id,
      })
      .select()
      .single();
    if (taskErr) return { error: taskErr.message };

    // 3. Link task to trip
    await supabase.from('vaccination_trips').update({ task_id: task.id }).eq('id', trip.id);

    // 4. Update queue items
    await supabase
      .from('vaccination_queue')
      .update({ trip_id: trip.id, status: 'agendada' })
      .in('id', input.queue_item_ids);

    await fetch();
    return { data: trip };
  };

  const cancelTrip = async (tripId: string) => {
    // Release queue items
    await supabase
      .from('vaccination_queue')
      .update({ trip_id: null, status: 'pendente' })
      .eq('trip_id', tripId);
    // Cancel task
    const { data: trip } = await supabase.from('vaccination_trips').select('task_id').eq('id', tripId).maybeSingle();
    if (trip?.task_id) {
      await supabase.from('tasks').update({ status: 'cancelada' }).eq('id', trip.task_id);
    }
    const { error } = await supabase.from('vaccination_trips').update({ status: 'cancelada' }).eq('id', tripId);
    if (error) return { error: error.message };
    await fetch();
    return { success: true };
  };

  const completeTrip = async (input: CompleteTripInput) => {
    if (!user) return { error: 'Não autenticado' };

    // For each result, upsert student_vaccine or release back to pending
    for (const r of input.results) {
      if (r.vacinado) {
        // Find or create vaccine record
        const { data: existing } = await supabase
          .from('student_vaccines')
          .select('id')
          .eq('student_id', r.student_id)
          .eq('vaccine_type_id', r.vaccine_type_id)
          .maybeSingle();
        if (existing) {
          await supabase
            .from('student_vaccines')
            .update({ tomou: true, data_vacinacao: input.data_vacinacao })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('student_vaccines')
            .insert({ student_id: r.student_id, vaccine_type_id: r.vaccine_type_id, tomou: true, data_vacinacao: input.data_vacinacao });
        }
        // Remove from queue
        await supabase.from('vaccination_queue').delete().eq('id', r.queue_item_id);
      } else {
        // Release back to pending with observation
        await supabase
          .from('vaccination_queue')
          .update({
            trip_id: null,
            status: 'pendente',
            observacoes: r.motivo || null,
          })
          .eq('id', r.queue_item_id);
      }
    }

    // Update trip
    await supabase
      .from('vaccination_trips')
      .update({ status: 'realizada', data_realizada: input.data_vacinacao })
      .eq('id', input.trip_id);

    // Update linked task
    const { data: trip } = await supabase.from('vaccination_trips').select('task_id').eq('id', input.trip_id).maybeSingle();
    if (trip?.task_id) {
      await supabase
        .from('tasks')
        .update({ status: 'realizada', data_conclusao: new Date().toISOString() })
        .eq('id', trip.task_id);
    }

    await fetch();
    return { success: true };
  };

  return { trips, loading, refetch: fetch, scheduleTrip, cancelTrip, completeTrip };
}
