DROP POLICY IF EXISTS "Admins can manage app config" ON public.app_config;

CREATE POLICY "Public can manage app config"
ON public.app_config
FOR ALL
TO anon, authenticated
USING ((auth.role() = 'anon'::text) OR (auth.role() = 'authenticated'::text))
WITH CHECK ((auth.role() = 'anon'::text) OR (auth.role() = 'authenticated'::text));

DROP POLICY IF EXISTS "Admins can upload catalog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update catalog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete catalog images" ON storage.objects;

CREATE POLICY "Public can upload banner images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/banners/%'
);

CREATE POLICY "Public can update banner images"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/banners/%'
)
WITH CHECK (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/banners/%'
);

CREATE POLICY "Public can delete banner images"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/banners/%'
);