drop policy if exists "Admins can manage roles" on public.user_roles;

create policy "Bootstrap first admin"
on public.user_roles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'admin'
  and not exists (
    select 1 from public.user_roles where role = 'admin'
  )
);

create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_role(auth.uid(), 'admin'));