import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Generate HTML response page
function generateResponsePage(success: boolean, eventTitle: string, action: string, participantName: string): string {
  const status = success ? 'sucesso' : 'erro';
  const statusColor = success ? '#22c55e' : '#ef4444';
  const statusIcon = success ? '✓' : '✗';
  const message = success 
    ? `Sua resposta "${action}" foi registrada com sucesso!`
    : 'Ocorreu um erro ao processar sua resposta. Tente novamente.';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resposta ao Convite - ${eventTitle}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          max-width: 500px;
          width: 90%;
          text-align: center;
        }
        .status-icon {
          font-size: 4rem;
          color: ${statusColor};
          margin-bottom: 20px;
        }
        .title {
          font-size: 1.8rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 30px;
        }
        .event-info {
          background: #f9fafb;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid ${statusColor};
        }
        .message {
          font-size: 1.1rem;
          color: #374151;
          margin-bottom: 30px;
          padding: 20px;
          background: ${success ? '#f0fdf4' : '#fef2f2'};
          border-radius: 8px;
          border: 1px solid ${success ? '#bbf7d0' : '#fecaca'};
        }
        .action-text {
          text-transform: capitalize;
          font-weight: 600;
          color: ${statusColor};
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-icon">${statusIcon}</div>
        <h1 class="title">Resposta ${status === 'sucesso' ? 'Registrada' : 'com Erro'}</h1>
        <p class="subtitle">Resposta ao convite para o evento</p>
        
        <div class="event-info">
          <h3>${eventTitle}</h3>
          <p><strong>Participante:</strong> ${participantName}</p>
          <p><strong>Ação:</strong> <span class="action-text">${action}</span></p>
        </div>
        
        <div class="message">
          ${message}
        </div>
        
        <div class="footer">
          <p>Sistema de Calendário</p>
          <p>Esta janela pode ser fechada.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    console.log('Processing invitation response:', { token, action });

    if (!token || !action) {
      return new Response(
        generateResponsePage(false, 'Evento', 'Resposta', 'Participante'),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
        }
      );
    }

    // Validate action
    if (!['aceitar', 'recusar'].includes(action)) {
      return new Response(
        generateResponsePage(false, 'Evento', action, 'Participante'),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
        }
      );
    }

    // Convert action to status
    const status = action === 'aceitar' ? 'confirmado' : 'recusado';

    // Fetch participant details first
    const { data: participantData, error: fetchError } = await supabase
      .from('external_event_participants')
      .select('id, email, name, status, event_id')
      .eq('invite_token', token)
      .single();

    if (fetchError || !participantData) {
      console.error('Error fetching participant:', fetchError);
      return new Response(
        generateResponsePage(false, 'Evento', action, 'Participante'),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
        }
      );
    }

    // Check if already responded
    if (participantData.status !== 'pendente') {
      const alreadyRespondedMessage = `Você já respondeu a este convite como "${participantData.status}".`;
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite já respondido</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f3f4f6;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
              max-width: 500px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Convite já respondido</h2>
            <p>${alreadyRespondedMessage}</p>
          </div>
        </body>
        </html>
        `,
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
        }
      );
    }

    // Fetch event details
    const { data: eventData, error: eventError } = await supabase
      .from('calendar_events')
      .select('titulo, created_by')
      .eq('id', participantData.event_id)
      .single();

    const eventTitle = eventData?.titulo || 'Evento';
    
    // Update participant status using the secure function
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_external_participant_status', {
        p_invite_token: token,
        p_status: status
      });

    if (updateError || !updateResult) {
      console.error('Error updating participant status:', updateError);
      return new Response(
        generateResponsePage(false, eventTitle, action, participantData.name),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
        }
      );
    }

    // Create notification for the event organizer if we have event data
    if (eventData?.created_by) {
      const organizerNotificationTitle = `Resposta ao convite: ${eventTitle}`;
      const organizerNotificationMessage = `${participantData.name} ${action === 'aceitar' ? 'aceitou' : 'recusou'} o convite para o evento "${eventTitle}".`;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: eventData.created_by,
          type: 'calendar_response',
          reference_id: participantData.event_id,
          title: organizerNotificationTitle,
          message: organizerNotificationMessage
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      } else {
        console.log('Notification created for organizer');
      }
    }

    // Return success page
    return new Response(
      generateResponsePage(true, eventTitle, action, participantData.name),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );

  } catch (error) {
    console.error('Error in process-invitation-response function:', error);
    
    return new Response(
      generateResponsePage(false, 'Evento', 'Resposta', 'Participante'),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } 
      }
    );
  }
});