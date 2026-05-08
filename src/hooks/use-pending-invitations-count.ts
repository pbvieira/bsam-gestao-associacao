import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePendingInvitationsCount() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count: c } = await supabase
      .from('event_participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_organizer', false)
      .eq('status', 'pendente');
    setCount(c || 0);
  };

  useEffect(() => {
    fetchCount();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel('pending-invites-count')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `user_id=eq.${user.id}`,
        }, () => fetchCount())
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        }, () => fetchCount())
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  return count;
}
