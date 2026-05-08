import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  eventId: string;
  type: 'update' | 'cancellation';
  // Snapshot do evento (necessário para cancellation, pois o evento será excluído)
  eventSnapshot?: {
    titulo: string;
    descricao: string | null;
    data_inicio: string;
    data_fim: string;
    location: string | null;
    all_day: boolean;
    created_by: string;
  };
  // Mudanças (para update). Não obrigatório.
  changedFields?: string[];
  // Filtros opcionais; se ausentes, envia para todos os participantes restantes
  targetParticipantUserIds?: string[];
  targetExternalEmails?: string[];
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

function formatICSDate(dateStr: string): string {
  return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generateICS(event: any, method: 'REQUEST' | 'CANCEL', sequence = 1): string {
  const uid = `${event.id}@calendarsystem.com`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sistema de Calendário//PT',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${formatICSDate(event.data_inicio)}`,
    `DTEND:${formatICSDate(event.data_fim)}`,
    `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
    `SUMMARY:${event.titulo}`,
    event.descricao ? `DESCRIPTION:${String(event.descricao).replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    `SEQUENCE:${sequence}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lines.join('\r\n');
}

async function sendEmail(to: string, subject: string, html: string, attachments: any[] = []) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY missing');
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Sistema de Calendário <onboarding@resend.dev>',
      to: [to], subject, html, attachments,
    }),
  });
  if (!resp.ok) throw new Error(`Resend error: ${await resp.text()}`);
  return resp.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: canWrite } = await supabase.rpc('has_capability', { _user_id: caller.id, _cap: 'calendar.write' });
    if (!canWrite) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body: UpdateRequest = await req.json();
    const { eventId, type, eventSnapshot, targetParticipantUserIds, targetExternalEmails } = body;

    // Buscar dados do evento (ou usar snapshot)
    let eventData: any = eventSnapshot ? { id: eventId, ...eventSnapshot } : null;
    if (!eventData) {
      const { data } = await supabase.from('calendar_events').select('*').eq('id', eventId).maybeSingle();
      eventData = data;
    }
    if (!eventData) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: organizerProfile } = await supabase.from('profiles').select('full_name').eq('user_id', eventData.created_by).maybeSingle();
    const organizerName = organizerProfile?.full_name || 'Organizador';

    // Participantes internos alvo
    let internalUserIds: string[] = [];
    if (targetParticipantUserIds && targetParticipantUserIds.length > 0) {
      internalUserIds = targetParticipantUserIds;
    } else {
      const { data: parts } = await supabase.from('event_participants').select('user_id, is_organizer').eq('event_id', eventId);
      internalUserIds = (parts || []).filter((p: any) => !p.is_organizer).map((p: any) => p.user_id);
    }

    // Externos alvo
    let externalRecipients: Array<{ email: string; name: string; invite_token?: string }> = [];
    if (targetExternalEmails && targetExternalEmails.length > 0) {
      externalRecipients = targetExternalEmails.map((email) => ({ email, name: email }));
    } else {
      const { data: ext } = await supabase.from('external_event_participants').select('email, name, invite_token').eq('event_id', eventId);
      externalRecipients = ext || [];
    }

    const isCancel = type === 'cancellation';
    const notifType = isCancel ? 'calendar_cancellation' : 'calendar_update';
    const notifTitle = isCancel ? 'Evento cancelado' : 'Evento atualizado';
    const notifMessage = isCancel
      ? `O evento "${eventData.titulo}" foi cancelado.`
      : `O evento "${eventData.titulo}" foi atualizado.`;

    // Inserir notificações para internos
    if (internalUserIds.length > 0) {
      const rows = internalUserIds.map((user_id) => ({
        user_id,
        type: notifType,
        reference_id: eventId,
        title: notifTitle,
        message: notifMessage,
        read: false,
      }));
      await supabase.from('notifications').insert(rows);
    }

    // Enviar e-mails
    const ics = generateICS(eventData, isCancel ? 'CANCEL' : 'REQUEST', isCancel ? 2 : 1);
    const icsBase64 = btoa(ics);
    const attachments = [{
      filename: `${String(eventData.titulo).replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
      content: icsBase64,
      type: 'text/calendar',
    }];

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const userId of internalUserIds) {
      try {
        const { data: au } = await supabase.auth.admin.getUserById(userId);
        const email = au.user?.email;
        if (!email) continue;
        const html = `
          <h2>${notifTitle}</h2>
          <p><strong>Organizador:</strong> ${organizerName}</p>
          <p><strong>Evento:</strong> ${eventData.titulo}</p>
          <p><strong>Data:</strong> ${new Date(eventData.data_inicio).toLocaleString('pt-BR')}</p>
          ${eventData.location ? `<p><strong>Local:</strong> ${eventData.location}</p>` : ''}
          <p>${isCancel ? 'Este evento foi cancelado.' : 'O evento foi atualizado. Verifique os novos detalhes.'}</p>
        `;
        await sendEmail(email, `${notifTitle}: ${eventData.titulo}`, html, attachments);
        emailsSent++;
      } catch (e) {
        console.error('email internal fail', e);
        emailsFailed++;
      }
    }

    for (const ext of externalRecipients) {
      try {
        const html = `
          <h2>Olá ${ext.name},</h2>
          <p>${isCancel ? `O evento <strong>${eventData.titulo}</strong> foi cancelado.` : `O evento <strong>${eventData.titulo}</strong> foi atualizado.`}</p>
          <p><strong>Organizador:</strong> ${organizerName}</p>
          <p><strong>Data:</strong> ${new Date(eventData.data_inicio).toLocaleString('pt-BR')}</p>
          ${eventData.location ? `<p><strong>Local:</strong> ${eventData.location}</p>` : ''}
        `;
        await sendEmail(ext.email, `${notifTitle}: ${eventData.titulo}`, html, attachments);
        emailsSent++;
      } catch (e) {
        console.error('email external fail', e);
        emailsFailed++;
      }
    }

    return new Response(JSON.stringify({ success: true, emailsSent, emailsFailed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-event-update error', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
