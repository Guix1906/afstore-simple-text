DROP POLICY IF EXISTS "Public can view catalog images" ON storage.objects;

CREATE POLICY "Public can view catalog images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'catalog-images'
  AND name LIKE 'public/%'
);