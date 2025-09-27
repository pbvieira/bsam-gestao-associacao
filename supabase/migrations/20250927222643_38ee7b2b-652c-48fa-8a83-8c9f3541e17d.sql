-- Insert all existing permissions for the administrador role
INSERT INTO public.permissions (module, action, role, allowed)
SELECT DISTINCT p.module, p.action, 'administrador'::user_role, true
FROM public.permissions p
WHERE NOT EXISTS (
  SELECT 1 FROM public.permissions p2 
  WHERE p2.module = p.module 
  AND p2.action = p.action 
  AND p2.role = 'administrador'::user_role
);

-- Create a function to automatically grant new permissions to administrador
CREATE OR REPLACE FUNCTION public.grant_permission_to_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if it's a new module/action combination and role is not administrador
  IF NEW.role != 'administrador' THEN
    INSERT INTO public.permissions (module, action, role, allowed)
    SELECT NEW.module, NEW.action, 'administrador'::user_role, true
    WHERE NOT EXISTS (
      SELECT 1 FROM public.permissions 
      WHERE module = NEW.module 
      AND action = NEW.action 
      AND role = 'administrador'::user_role
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically grant new permissions to administrador
CREATE TRIGGER auto_grant_admin_permissions
  AFTER INSERT ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_permission_to_admin();