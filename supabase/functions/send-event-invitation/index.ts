import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  eventId: string;
  participantIds: string[];
  externalParticipants: Array<{
    email: string;
    name: string;
  }>;
}

interface EventData {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  location: string | null;
  all_day: boolean;
  recurrence_type: string;
  created_by: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Generate ICS file content
function generateICSFile(event: EventData): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `${event.id}@calendarsystem.com`;
  const dtstart = formatDate(event.data_inicio);
  const dtend = formatDate(event.data_fim);
  const created = formatDate(new Date().toISOString());
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sistema de Calendário//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `DTSTAMP:${created}`,
    `SUMMARY:${event.titulo}`,
    event.descricao ? `DESCRIPTION:${event.descricao.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(line => line !== '').join('\r\n');

  return icsContent;
}

// Send email using Resend API
async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const emailData = {
    from: 'Sistema de Calendário <onboarding@resend.dev>',
    to: [to],
    subject,
    html,
    attachments: attachments || []
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, participantIds = [], externalParticipants = [] }: InvitationRequest = await req.json();

    console.log('Processing invitation request for event:', eventId);
    console.log('Internal participants:', participantIds.length);
    console.log('External participants:', externalParticipants.length);

    // Fetch event details
    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error('Error fetching event:', eventError);
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch organizer details
    const { data: organizerProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', eventData.created_by)
      .single();

    const organizerName = organizerProfile?.full_name || 'Organizador';

    // Generate ICS file
    const icsContent = generateICSFile(eventData);
    const icsBase64 = btoa(icsContent);

    let emailsSent = 0;
    let emailsFailed = 0;

    // Process internal participants - ONLY SEND EMAILS (participants already inserted by hook)
    if (participantIds.length > 0) {
      console.log('Sending emails to internal participants...');

      // Fetch internal participants info
      const { data: internalUsers } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', participantIds);

      if (internalUsers) {
        for (const user of internalUsers) {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id);
          
          if (authUser.user?.email) {
            try {
              const emailHtml = `
                <h2>Você foi convidado para um evento</h2>
                <p><strong>Organizador:</strong> ${organizerName}</p>
                <p><strong>Evento:</strong> ${eventData.titulo}</p>
                <p><strong>Data:</strong> ${new Date(eventData.data_inicio).toLocaleString('pt-BR')}</p>
                ${eventData.descricao ? `<p><strong>Descrição:</strong> ${eventData.descricao}</p>` : ''}
                ${eventData.location ? `<p><strong>Local:</strong> ${eventData.location}</p>` : ''}
                
                <p>O arquivo .ics em anexo pode ser adicionado ao seu calendário.</p>
                <p>Acesse o sistema para responder ao convite.</p>
                
                <p>Atenciosamente,<br>Sistema de Calendário</p>
              `;

              const attachments = [
                {
                  filename: `${eventData.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
                  content: icsBase64,
                  type: 'text/calendar',
                }
              ];

              await sendEmail(
                authUser.user.email,
                `Convite para evento: ${eventData.titulo}`,
                emailHtml,
                attachments
              );
              
              console.log(`Email sent to internal user: ${authUser.user.email}`);
              emailsSent++;
            } catch (emailError) {
              console.error(`Failed to send email to ${authUser.user.email}:`, emailError);
              emailsFailed++;
            }
          }
        }
      }
    }

    // Process external participants - ONLY SEND EMAILS (participants already inserted by hook)
    if (externalParticipants.length > 0) {
      console.log('Sending emails to external participants...');

      // Fetch external participants with their invite tokens (already inserted by the hook)
      const { data: externalParticipantsData, error: fetchError } = await supabase
        .from('external_event_participants')
        .select('email, name, invite_token')
        .eq('event_id', eventId);

      if (fetchError) {
        console.error('Error fetching external participants:', fetchError);
      } else if (externalParticipantsData && externalParticipantsData.length > 0) {
        for (const participant of externalParticipantsData) {
          const acceptUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-invitation-response?token=${participant.invite_token}&action=aceitar`;
          const declineUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-invitation-response?token=${participant.invite_token}&action=recusar`;

          try {
            const emailHtml = `
              <h2>Olá ${participant.name},</h2>
              <p>Você foi convidado para participar de um evento.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3>${eventData.titulo}</h3>
                <p><strong>Organizador:</strong> ${organizerName}</p>
                <p><strong>Data:</strong> ${new Date(eventData.data_inicio).toLocaleString('pt-BR')}</p>
                ${eventData.descricao ? `<p><strong>Descrição:</strong> ${eventData.descricao}</p>` : ''}
                ${eventData.location ? `<p><strong>Local:</strong> ${eventData.location}</p>` : ''}
              </div>
              
              <div style="margin: 30px 0;">
                <a href="${acceptUrl}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
                  ✓ Aceitar Convite
                </a>
                <a href="${declineUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  ✗ Recusar Convite
                </a>
              </div>
              
              <p>O arquivo .ics em anexo pode ser adicionado ao seu calendário.</p>
              
              <p>Atenciosamente,<br>Sistema de Calendário</p>
            `;

            const attachments = [
              {
                filename: `${eventData.titulo.replace(/[^a-zA-Z0-9]/g, '_')}.ics`,
                content: icsBase64,
                type: 'text/calendar',
              }
            ];

            await sendEmail(
              participant.email,
              `Convite para evento: ${eventData.titulo}`,
              emailHtml,
              attachments
            );
            
            console.log(`Email sent to external participant: ${participant.email}`);
            emailsSent++;
          } catch (emailError) {
            console.error(`Failed to send email to ${participant.email}:`, emailError);
            emailsFailed++;
          }
        }
      } else {
        console.log('No external participants found in database for event:', eventId);
      }
    }

    console.log(`Invitation processing complete. Sent: ${emailsSent}, Failed: ${emailsFailed}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Convites enviados: ${emailsSent} sucesso, ${emailsFailed} falhas`,
        emailsSent,
        emailsFailed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-event-invitation function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
