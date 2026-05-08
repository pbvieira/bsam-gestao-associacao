import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔥 create-user: Iniciando criação de usuário');
    
    // Criar cliente admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar se o usuário atual é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('🔥 create-user: Authorization header não encontrado');
      throw new Error('Unauthorized: No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      console.error('🔥 create-user: Erro ao obter usuário', userError);
      throw new Error('Unauthorized: Invalid token')
    }

    console.log('🔥 create-user: Usuário autenticado', user.id);

    // Verificar capability users.manage via RPC (server-side)
    const { data: canManage, error: capError } = await supabaseAdmin
      .rpc('has_capability', { _user_id: user.id, _cap: 'users.manage' });

    if (capError) {
      console.error('🔥 create-user: Erro ao verificar capability', capError);
      throw new Error('Forbidden: capability check failed');
    }

    if (!canManage) {
      console.error('🔥 create-user: Usuário sem capability users.manage');
      throw new Error('Forbidden: missing capability users.manage');
    }

    console.log('🔥 create-user: Capability users.manage verificada');

    // Obter dados do body
    const { email, password, full_name, role, active = true, area_id = null, setor_id = null } = await req.json()

    console.log('🔥 create-user: Criando usuário', { email, full_name, role, active, area_id, setor_id });

    // Criar usuário usando Admin API (NÃO faz login automático)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: {
        full_name,
        role
      }
    })

    if (createError) {
      console.error('🔥 create-user: Erro ao criar usuário', createError);
      const code = (createError as any).code;
      const status = (createError as any).status;
      if (code === 'email_exists' || status === 422) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já está cadastrado no sistema.', code: 'email_exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        )
      }
      throw createError
    }

    console.log('🔥 create-user: Usuário criado com sucesso', newUser.user.id);

    // Atualizar o perfil com o role, status, area e setor corretos (garantia extra)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role, 
        active,
        area_id: area_id || null,
        setor_id: setor_id || null
      })
      .eq('user_id', newUser.user.id)

    if (updateError) {
      console.error('🔥 create-user: Erro ao atualizar perfil', updateError);
      // Não falha a operação, pois o usuário já foi criado
    } else {
      console.log('🔥 create-user: Perfil atualizado com sucesso');
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('🔥 create-user: Erro geral', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
