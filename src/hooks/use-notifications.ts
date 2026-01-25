import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export type NotificationType = 'task' | 'event' | 'reminder' | 'mention' | 'calendar_invite' | 'calendar_reminder' | 'calendar_update' | 'calendar_cancellation';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id?: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  reminder_1h: boolean;
  reminder_15min: boolean;
  reminder_at_time: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const notificationData = data || [];
      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !n.read).length);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao marcar notificações como lidas",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erro ao excluir notificação:', err);
    }
  };

  const respondToEventInvite = async (eventId: string, response: 'aceito' | 'recusado') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar informações do evento
      const { data: eventData, error: eventError } = await supabase
        .from('calendar_events')
        .select('titulo, created_by')
        .eq('id', eventId)
        .maybeSingle();

      if (eventError) throw eventError;

      // Verificar se o evento existe
      if (!eventData) {
        // Evento foi deletado - remover a notificação órfã
        await supabase
          .from('notifications')
          .delete()
          .eq('type', 'calendar_invite')
          .eq('reference_id', eventId)
          .eq('user_id', user.id);
        
        // Atualizar estado local
        setNotifications(prev => 
          prev.filter(n => !(n.type === 'calendar_invite' && n.reference_id === eventId))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Evento não encontrado",
          description: "Este evento foi cancelado ou removido.",
          variant: "destructive",
        });
        return;
      }

      // Buscar nome do usuário que está respondendo
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const userName = profileData?.full_name || 'Um participante';

      if (response === 'aceito') {
        // Atualizar status para aceito
        const { error } = await supabase
          .from('event_participants')
          .update({ status: 'aceito' })
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Notificar o organizador sobre o aceite
        await supabase
          .from('notifications')
          .insert({
            user_id: eventData.created_by,
            type: 'calendar_update',
            reference_id: eventId,
            title: 'Convite aceito',
            message: `${userName} aceitou o convite para o evento "${eventData.titulo}"`,
            read: false
          });

        toast({
          title: "Sucesso",
          description: "Convite aceito com sucesso",
        });
      } else {
        // Recusar = remover participante
        const { error } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Enviar notificação para o criador do evento
        await supabase
          .from('notifications')
          .insert({
            user_id: eventData.created_by,
            type: 'calendar_update',
            reference_id: eventId,
            title: 'Convite recusado',
            message: `${userName} recusou o convite para o evento "${eventData.titulo}"`,
            read: false
          });

        toast({
          title: "Sucesso",
          description: "Convite recusado com sucesso",
        });
      }

      // Deletar a notificação do convite diretamente no banco
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('type', 'calendar_invite')
        .eq('reference_id', eventId)
        .eq('user_id', user.id);

      if (!deleteError) {
        // Atualizar estado local removendo a notificação
        setNotifications(prev => 
          prev.filter(n => !(n.type === 'calendar_invite' && n.reference_id === eventId))
        );
        // Decrementar contador se a notificação não estava lida
        const wasUnread = notifications.find(
          n => n.type === 'calendar_invite' && n.reference_id === eventId && !n.read
        );
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }

    } catch (err) {
      console.error('Erro ao responder convite:', err);
      toast({
        title: "Erro",
        description: "Erro ao responder convite",
        variant: "destructive",
      });
    }
  };

  const getNotificationSettings = async (): Promise<NotificationSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      return null;
    }
  };

  const updateNotificationSettings = async (settings: Partial<NotificationSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_settings')
        .upsert({ 
          user_id: user.id,
          ...settings 
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações atualizadas com sucesso",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações",
        variant: "destructive",
      });
    }
  };

  // Configurar listener para notificações em tempo real
  useEffect(() => {
    fetchNotifications();

    const getUserData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const channel = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${currentUser.id}`
            },
            (payload) => {
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
              
              // Exibir toast para notificações importantes
              if (newNotification.type === 'task' || newNotification.type === 'event') {
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };
    
    getUserData();
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    respondToEventInvite,
    getNotificationSettings,
    updateNotificationSettings,
    refetch: fetchNotifications,
  };
}