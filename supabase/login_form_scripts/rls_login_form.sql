alter table public.profiles enable row level security;

create policy "Разрешить авторизованным пользователям видеть все профили"
  on public.profiles for select
  using ( auth.role() = 'authenticated');

create policy "Пользователь может менять только свой профиль"
  on public.profiles for update
  using ( auth.uid() = id );