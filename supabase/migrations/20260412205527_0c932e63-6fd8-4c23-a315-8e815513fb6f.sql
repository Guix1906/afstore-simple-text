CREATE POLICY "Public can view app config"
ON public.app_config
FOR SELECT
USING (true);