update public.profiles
set role = 'admin', is_active = true
where id = (
  select id from auth.users
  where email = 'admin@example.com'
);