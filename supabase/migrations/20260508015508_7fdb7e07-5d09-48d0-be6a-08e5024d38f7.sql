INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT role_id, 'system_settings.read', true
FROM public.role_capabilities WHERE capability = 'system.admin' AND allowed = true
ON CONFLICT (role_id, capability) DO UPDATE SET allowed = true;

INSERT INTO public.role_capabilities (role_id, capability, allowed)
SELECT role_id, 'system_settings.write', true
FROM public.role_capabilities WHERE capability = 'system.admin' AND allowed = true
ON CONFLICT (role_id, capability) DO UPDATE SET allowed = true;