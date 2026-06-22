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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { data: canManage, error: capError } = await supabaseAdmin
      .rpc('has_capability', { _user_id: user.id, _cap: 'users.manage' })
    if (capError || !canManage) throw new Error('Forbidden: missing capability users.manage')

    const { user_id, new_email, new_password } = await req.json()

    if (!user_id) throw new Error('user_id é obrigatório')
    if (!new_email && !new_password) throw new Error('Informe new_email ou new_password')

    const updates: Record<string, unknown> = {}
    if (new_email) {
      if (typeof new_email !== 'string' || !/^\S+@\S+\.\S+$/.test(new_email)) {
        throw new Error('E-mail inválido')
      }
      updates.email = new_email
      updates.email_confirm = true
    }
    if (new_password) {
      if (typeof new_password !== 'string' || new_password.length < 6) {
        throw new Error('Senha deve ter ao menos 6 caracteres')
      }
      updates.password = new_password
    }

    console.log('Updating user', user_id, 'fields:', Object.keys(updates))
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, updates)
    if (error) {
      console.error('updateUserById error:', JSON.stringify(error), 'status:', (error as any).status, 'code:', (error as any).code)
      const code = (error as any).code
      const msg = (error.message || '').toLowerCase()
      const isEmailDup =
        code === 'email_exists' ||
        (error as any).status === 422 ||
        msg.includes('users_email_partial_key') ||
        msg.includes('duplicate key') ||
        msg.includes('already been registered') ||
        msg.includes('already registered')
      if (isEmailDup) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já está em uso por outro usuário.', code: 'email_exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        )
      }
      return new Response(
        JSON.stringify({ error: error.message || 'Falha ao atualizar usuário' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, user: data.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('admin-update-user-credentials catch:', message, JSON.stringify(error))
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
