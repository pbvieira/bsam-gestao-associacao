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
  external_participants?: Array<{
    id: string;
    name: string;
    email: string;
    status: ParticipantStatus;
  }>;
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
      console.log('🔄 Iniciando fetchEvents...', { startDate, endDate });
      
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          created_by_profile:profiles!calendar_events_created_by_fkey(full_name),
          participants:event_participants(
            *,
            user_profile:profiles!event_participants_user_id_fkey(full_name)
          ),
          external_participants:external_event_participants(*)
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
      
      console.log('✅ Eventos carregados:', data?.length || 0);
      console.log('📋 Dados:', data);
      setEvents(data || []);
    } catch (err) {
      console.error('❌ Erro ao carregar eventos:', err);
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

      // Adicionar participantes externos ao banco
      if (externalParticipants.length > 0) {
        const externalParticipantsData = externalParticipants.map(ext => ({
          event_id: data.id,
          name: ext.name,
          email: ext.email,
          status: 'pendente' as ParticipantStatus
        }));

        console.log('Adding external participants:', externalParticipantsData);
        const { error: externalError } = await supabase
          .from('external_event_participants')
          .insert(externalParticipantsData);

        if (externalError) {
          console.error('Error adding external participants:', externalError);
          toast({
            title: "Aviso",
            description: "Evento criado, mas houve erro ao registrar participantes externos",
            variant: "destructive",
          });
        } else {
          console.log('External participants added successfully');
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

  const updateEvent = async (
    id: string,
    updates: Partial<CalendarEvent>,
    options?: {
      addedParticipantIds?: string[];
      removedParticipantIds?: string[];
      addedExternalParticipants?: Array<{ name: string; email: string }>;
      removedExternalEmails?: string[];
      keptParticipantIds?: string[];
      keptExternalEmails?: string[];
      significantChange?: boolean;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      const opts = options || {};

      // Notificar participantes mantidos sobre mudança significativa
      if (opts.significantChange && ((opts.keptParticipantIds && opts.keptParticipantIds.length > 0) || (opts.keptExternalEmails && opts.keptExternalEmails.length > 0))) {
        try {
          await supabase.functions.invoke('send-event-update', {
            body: {
              eventId: id,
              type: 'update',
              targetParticipantUserIds: opts.keptParticipantIds || [],
              targetExternalEmails: opts.keptExternalEmails || [],
            },
          });
        } catch (e) {
          console.error('send-event-update failed:', e);
        }
      }

      // Enviar convite para participantes novos
      if ((opts.addedParticipantIds && opts.addedParticipantIds.length > 0) || (opts.addedExternalParticipants && opts.addedExternalParticipants.length > 0)) {
        try {
          await supabase.functions.invoke('send-event-invitation', {
            body: {
              eventId: id,
              participantIds: opts.addedParticipantIds || [],
              externalParticipants: opts.addedExternalParticipants || [],
            },
          });
        } catch (e) {
          console.error('send-event-invitation (added) failed:', e);
        }
      }

      // Enviar cancelamento para removidos
      if ((opts.removedParticipantIds && opts.removedParticipantIds.length > 0) || (opts.removedExternalEmails && opts.removedExternalEmails.length > 0)) {
        try {
          await supabase.functions.invoke('send-event-update', {
            body: {
              eventId: id,
              type: 'cancellation',
              targetParticipantUserIds: opts.removedParticipantIds || [],
              targetExternalEmails: opts.removedExternalEmails || [],
            },
          });
        } catch (e) {
          console.error('send-event-update (cancellation) failed:', e);
        }
      }

      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso",
      });
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
      // Capturar snapshot antes de excluir
      const { data: snapshot } = await supabase
        .from('calendar_events')
        .select('titulo, descricao, data_inicio, data_fim, location, all_day, created_by')
        .eq('id', id)
        .maybeSingle();

      // Notificar participantes ANTES da exclusão
      if (snapshot) {
        try {
          await supabase.functions.invoke('send-event-update', {
            body: {
              eventId: id,
              type: 'cancellation',
              eventSnapshot: snapshot,
            },
          });
        } catch (e) {
          console.error('cancellation notify failed:', e);
        }
      }

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

    // Canal 1: Monitora eventos
    const eventsChannel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        (payload) => {
          console.log('📅 Evento alterado:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    // Canal 2: Monitora participantes internos
    const participantsChannel = supabase
      .channel('event-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants'
        },
        (payload) => {
          console.log('👤 Participante alterado:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    // Canal 3: Monitora participantes externos
    const externalChannel = supabase
      .channel('external-participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'external_event_participants'
        },
        (payload) => {
          console.log('📧 Participante externo alterado:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(externalChannel);
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