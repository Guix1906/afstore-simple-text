DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Public can manage products"
ON public.products
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage app config" ON public.app_config;
CREATE POLICY "Public can manage app config"
ON public.app_config
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can upload catalog images" ON storage.objects;
CREATE POLICY "Public can upload catalog images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
);

DROP POLICY IF EXISTS "Admins can update catalog images" ON storage.objects;
CREATE POLICY "Public can update catalog images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
)
WITH CHECK (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
);

DROP POLICY IF EXISTS "Admins can delete catalog images" ON storage.objects;
CREATE POLICY "Public can delete catalog images"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
);