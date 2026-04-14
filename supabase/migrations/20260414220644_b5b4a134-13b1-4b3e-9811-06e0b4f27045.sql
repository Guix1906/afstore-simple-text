CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'leggings',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  discount INTEGER,
  image_url TEXT,
  images TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  sizes TEXT[] NOT NULL DEFAULT '{P,M,G}'::TEXT[],
  colors JSONB NOT NULL DEFAULT '[]'::JSONB,
  description TEXT NOT NULL DEFAULT '',
  measurements TEXT,
  is_new BOOLEAN NOT NULL DEFAULT true,
  is_best_seller BOOLEAN NOT NULL DEFAULT false,
  is_on_sale BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  gender TEXT NOT NULL DEFAULT 'feminino',
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_active_created_at ON public.products(active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products(category, active);

CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_number TEXT NOT NULL DEFAULT '',
  whatsapp_message TEXT NOT NULL DEFAULT '',
  hero_image_url TEXT,
  hero_image_urls TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_products_set_updated_at ON public.products;
CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_app_config_set_updated_at ON public.app_config;
CREATE TRIGGER trg_app_config_set_updated_at
BEFORE UPDATE ON public.app_config
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products"
ON public.products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Public can view app config" ON public.app_config;
CREATE POLICY "Public can view app config"
ON public.app_config
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage app config" ON public.app_config;
CREATE POLICY "Admins can manage app config"
ON public.app_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, name = EXCLUDED.name;

DROP POLICY IF EXISTS "Public can view catalog images" ON storage.objects;
CREATE POLICY "Public can view catalog images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'catalog-images');

DROP POLICY IF EXISTS "Admins can upload catalog images" ON storage.objects;
CREATE POLICY "Admins can upload catalog images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'catalog-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update catalog images" ON storage.objects;
CREATE POLICY "Admins can update catalog images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'catalog-images'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'catalog-images'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can delete catalog images" ON storage.objects;
CREATE POLICY "Admins can delete catalog images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'catalog-images'
  AND public.has_role(auth.uid(), 'admin')
);

INSERT INTO public.app_config (whatsapp_number, whatsapp_message, hero_image_url, hero_image_urls)
SELECT
  '5599985530617',
  'Olá! Vim pelo catálogo da AF STORE, pode me ajudar?',
  '/WhatsApp%20Image%202026-04-12%20at%2020.49.18.jpeg',
  ARRAY[
    '/WhatsApp%20Image%202026-04-12%20at%2020.49.18.jpeg',
    '/WhatsApp%20Image%202026-04-12%20at%2020.47.23.jpeg',
    '/WhatsApp%20Image%202026-04-12%20at%2020.45.37%20(2).jpeg'
  ]::TEXT[]
WHERE NOT EXISTS (SELECT 1 FROM public.app_config);