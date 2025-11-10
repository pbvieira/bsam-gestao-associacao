import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !currentUser) {
      throw new Error('Não autorizado');
    }

    console.log('Delete user request from:', currentUser.id);

    // Get the current user's profile to check permissions
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError || !currentProfile) {
      throw new Error('Perfil não encontrado');
    }

    // Check if user is admin
    if (currentProfile.role !== 'administrador') {
      throw new Error('Apenas administradores podem excluir usuários');
    }

    // Get the userId from request body
    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error('ID do usuário não fornecido');
    }

    console.log('Attempting to delete user:', userId);

    // 1. Check if user is linked to a student
    const { data: student, error: studentCheckError } = await supabaseAdmin
      .from('students')
      .select('id, nome_completo')
      .eq('user_id', userId)
      .maybeSingle();

    if (studentCheckError) {
      console.error('Error checking student link:', studentCheckError);
      throw new Error('Erro ao verificar vínculo com aluno');
    }

    if (student) {
      console.log('User is linked to student:', student.nome_completo);
      throw new Error('Não é possível excluir este usuário pois ele está vinculado a um cadastro de aluno. Os dados do aluno devem ser preservados.');
    }

    // 2. Check if this is the last admin
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (targetProfile?.role === 'administrador') {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'administrador')
        .eq('active', true);

      if (count && count <= 1) {
        throw new Error('Não é possível excluir o último administrador do sistema');
      }
    }

    // 3. Prevent user from deleting themselves
    if (userId === currentUser.id) {
      throw new Error('Você não pode excluir seu próprio usuário');
    }

    // 4. Delete related data explicitly (tasks and calendar events)
    console.log('Deleting user tasks...');
    const { error: tasksError } = await supabaseAdmin
      .from('tasks')
      .delete()
      .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);

    if (tasksError) {
      console.error('Error deleting tasks:', tasksError);
      // Continue anyway, as cascade should handle this
    }

    console.log('Deleting user calendar events...');
    const { error: eventsError } = await supabaseAdmin
      .from('calendar_events')
      .delete()
      .eq('created_by', userId);

    if (eventsError) {
      console.error('Error deleting events:', eventsError);
      // Continue anyway, as cascade should handle this
    }

    console.log('Deleting user event participations...');
    const { error: participationsError } = await supabaseAdmin
      .from('event_participants')
      .delete()
      .eq('user_id', userId);

    if (participationsError) {
      console.error('Error deleting participations:', participationsError);
      // Continue anyway
    }

    // 5. Delete from auth.users (will cascade to profiles)
    console.log('Deleting user from auth.users...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error(`Erro ao excluir usuário: ${deleteError.message}`);
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Usuário excluído com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro ao excluir usuário'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
