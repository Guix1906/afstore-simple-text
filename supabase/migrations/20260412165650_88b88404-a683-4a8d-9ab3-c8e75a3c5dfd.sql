-- Remove vulnerable bootstrap policy that allowed privilege escalation
DROP POLICY IF EXISTS "Bootstrap first admin" ON public.user_roles;

-- Replace public read access to app config with admin-only read access
DROP POLICY IF EXISTS "Public can view app config" ON public.app_config;

CREATE POLICY "Admins can view app config"
ON public.app_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));