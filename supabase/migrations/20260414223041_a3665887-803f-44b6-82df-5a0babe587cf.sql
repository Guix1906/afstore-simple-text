DROP POLICY IF EXISTS "Public can manage products" ON public.products;
CREATE POLICY "Public can manage products"
ON public.products
FOR ALL
TO anon, authenticated
USING (auth.role() = 'anon' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can manage app config" ON public.app_config;
CREATE POLICY "Public can manage app config"
ON public.app_config
FOR ALL
TO anon, authenticated
USING (auth.role() = 'anon' OR auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');