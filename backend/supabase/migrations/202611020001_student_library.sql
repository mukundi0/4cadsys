create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 200),
  author text not null default '' check (length(author) <= 200),
  subject text not null default '' check (length(subject) <= 120),
  class_level text not null default '' check (length(class_level) <= 80),
  description text not null default '' check (length(description) <= 2000),
  storage_path text not null unique,
  file_name text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 10485760),
  uploaded_by uuid not null references auth.users(id),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.library_books enable row level security;
revoke all on public.library_books from anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('school-private', 'school-private', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false,
  file_size_limit = greatest(storage.buckets.file_size_limit, excluded.file_size_limit),
  allowed_mime_types = array(select distinct unnest(storage.buckets.allowed_mime_types || excluded.allowed_mime_types));
