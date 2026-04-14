create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'moderator', 'user');

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2),
  discount integer,
  images jsonb not null default '[]'::jsonb,
  sizes text[] not null default '{}',
  colors jsonb not null default '[]'::jsonb,
  description text,
  measurements text,
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  is_on_sale boolean not null default false,
  active boolean not null default true,
  gender text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_config (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number text not null,
  whatsapp_message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.products enable row level security;
alter table public.app_config enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_app_config_updated_at on public.app_config;
create trigger set_app_config_updated_at
before update on public.app_config
for each row
execute function public.set_updated_at();

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products
for select
to anon, authenticated
using (active = true or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can create products" on public.products;
create policy "Admins can create products"
on public.products
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Public can view app config" on public.app_config;
create policy "Public can view app config"
on public.app_config
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert app config" on public.app_config;
create policy "Admins can insert app config"
on public.app_config
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can update app config" on public.app_config;
create policy "Admins can update app config"
on public.app_config
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can delete app config" on public.app_config;
create policy "Admins can delete app config"
on public.app_config
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.app_config (whatsapp_number, whatsapp_message)
select '5599985530617', 'Olá! Vim pelo catálogo da AF STORE 🛍️\nPode me ajudar?'
where not exists (select 1 from public.app_config);

create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_active on public.products(active);
create index if not exists idx_products_is_new on public.products(is_new);
create index if not exists idx_products_is_best_seller on public.products(is_best_seller);
create index if not exists idx_products_is_on_sale on public.products(is_on_sale);