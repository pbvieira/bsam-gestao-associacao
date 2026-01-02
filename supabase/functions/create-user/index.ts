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

    // Verificar se é admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('🔥 create-user: Erro ao obter perfil', profileError);
      throw new Error('Forbidden: Profile not found')
    }

    if (!['administrador', 'diretor', 'coordenador'].includes(profile.role)) {
      console.error('🔥 create-user: Usuário sem permissão', profile.role);
      throw new Error('Forbidden: Only admins can create users')
    }

    console.log('🔥 create-user: Permissão verificada, role:', profile.role);

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
