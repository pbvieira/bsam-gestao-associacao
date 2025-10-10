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
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar eventos');
      setEvents([]); // Set empty array on error
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
    participantIds: string[] = [],
    externalParticipants: Array<{ email: string; name: string }> = []
  ) => {
    try {
      console.log('Creating event with data:', eventData);
      
      // Validar dados obrigatórios
      if (!eventData.titulo?.trim()) {
        throw new Error('Título é obrigatório');
      }
      if (!eventData.created_by) {
        throw new Error('Criador é obrigatório');
      }
      if (!eventData.data_inicio || !eventData.data_fim) {
        throw new Error('Datas de início e fim são obrigatórias');
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating event:', error);
        throw error;
      }

      console.log('Event created successfully:', data);

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
        console.log('Adding participants:', participantsToAdd);
        const { error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantsToAdd);

        if (participantsError) {
          console.error('Error adding participants:', participantsError);
          throw participantsError;
        }
      }

      // Enviar convites se houver participantes internos ou externos
      if (participantIds.length > 0 || externalParticipants.length > 0) {
        try {
          console.log('Sending invitations...');
          const { error: inviteError } = await supabase.functions.invoke('send-event-invitation', {
            body: {
              eventId: data.id,
              participantIds,
              externalParticipants
            }
          });

          if (inviteError) {
            console.error('Error sending invitations:', inviteError);
            toast({
              title: "Aviso",
              description: "Evento criado, mas houve erro ao enviar alguns convites",
              variant: "destructive",
            });
          } else {
            console.log('Invitations sent successfully');
          }
        } catch (inviteErr) {
          console.error('Error calling invitation function:', inviteErr);
          toast({
            title: "Aviso", 
            description: "Evento criado, mas houve erro ao enviar convites",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso",
      });

      // Força re-fetch para garantir que os dados estejam atualizados
      await fetchEvents();
      return data;
    } catch (err) {
      console.error('Error creating event:', err);
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

      // Força re-fetch para garantir que os dados estejam atualizados
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

    // Configurar subscription para atualizações em tempo real
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('Mudança no calendário detectada:', payload);
          // Recarregar eventos quando houver qualquer mudança
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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