import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type EventType = 'reuniao' | 'atendimento' | 'evento' | 'lembrete';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type ParticipantStatus = 'pendente' | 'aceito' | 'recusado';

export interface CalendarEvent {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: EventType;
  data_inicio: string;
  data_fim: string;
  all_day: boolean;
  recurrence_type: RecurrenceType;
  recurrence_end?: string;
  location?: string;
  created_by: string;
  task_id?: string;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    full_name: string;
  };
  participants?: EventParticipant[];
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  is_organizer: boolean;
  created_at: string;
  user_profile?: {
    full_name: string;
  };
}

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEvents = async (startDate?: Date, endDate?: Date) => {
    try {
      setLoading(true);
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          created_by_profile:profiles!calendar_events_created_by_fkey(full_name),
          participants:event_participants(
            *,
            user_profile:profiles!event_participants_user_id_fkey(full_name)
          )
        `)
        .order('data_inicio', { ascending: true });

      if (startDate) {
        query = query.gte('data_inicio', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('data_fim', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data as any) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (
    eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'created_by_profile' | 'participants'>,
    participantIds: string[] = []
  ) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      // Adicionar organizador como participante
      const participantsToAdd = [
        {
          event_id: data.id,
          user_id: eventData.created_by,
          status: 'aceito' as ParticipantStatus,
          is_organizer: true
        },
        ...participantIds.map(userId => ({
          event_id: data.id,
          user_id: userId,
          status: 'pendente' as ParticipantStatus,
          is_organizer: false
        }))
      ];

      if (participantsToAdd.length > 0) {
        const { error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantsToAdd);

        if (participantsError) throw participantsError;
      }

      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso",
      });

      await fetchEvents();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar evento';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso",
      });

      await fetchEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar evento';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso",
      });

      await fetchEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir evento';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateParticipantStatus = async (participantId: string, status: ParticipantStatus) => {
    try {
      const { error } = await supabase
        .from('event_participants')
        .update({ status })
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Status atualizado para ${status}`,
      });

      await fetchEvents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar status';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getEventsByDateRange = (startDate: Date, endDate: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.data_inicio);
      const eventEnd = new Date(event.data_fim);
      return eventStart <= endDate && eventEnd >= startDate;
    });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    updateParticipantStatus,
    getEventsByDateRange,
    refetch: fetchEvents,
  };
}