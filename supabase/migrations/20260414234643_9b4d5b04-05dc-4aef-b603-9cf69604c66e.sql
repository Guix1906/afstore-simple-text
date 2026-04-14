DROP POLICY IF EXISTS "Public can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can manage app config" ON public.app_config;

CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage app config"
ON public.app_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public can upload catalog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update catalog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete catalog images" ON storage.objects;

CREATE POLICY "Admins can upload catalog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can update catalog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "Admins can delete catalog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);