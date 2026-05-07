
-- Fix 1: Restrict medication_administration_log SELECT to authorized roles
DROP POLICY IF EXISTS "Authenticated users can view medication logs" ON public.medication_administration_log;
CREATE POLICY "Authorized users can view medication logs"
ON public.medication_administration_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = ANY (ARRAY['coordenador'::user_role, 'diretor'::user_role, 'auxiliar'::user_role, 'administrador'::user_role])
  )
);

-- Also restrict medical_appointment_log SELECT consistently
DROP POLICY IF EXISTS "Authenticated users can view appointment logs" ON public.medical_appointment_log;
CREATE POLICY "Authorized users can view appointment logs"
ON public.medical_appointment_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = ANY (ARRAY['coordenador'::user_role, 'diretor'::user_role, 'auxiliar'::user_role, 'administrador'::user_role])
  )
);

-- Fix 2: Prevent privilege escalation on profiles
DROP POLICY IF EXISTS "Users can update profiles with admin access" ON public.profiles;
CREATE POLICY "Users can update profiles with admin access"
ON public.profiles
FOR UPDATE
USING ((auth.uid() = user_id) OR public.is_admin_user(auth.uid()))
WITH CHECK (
  public.is_admin_user(auth.uid())
  OR (
    auth.uid() = user_id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
    AND active = (SELECT p.active FROM public.profiles p WHERE p.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (role = 'aluno'::user_role OR public.is_admin_user(auth.uid()))
);

-- Fix 3: Restrict notifications INSERT to authenticated users only (not unauthenticated public)
DROP POLICY IF EXISTS "System can create notifications for users" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
