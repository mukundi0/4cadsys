create table if not exists public.student_saved_books (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  work_key text not null check (work_key ~ '^OL[0-9]+W$'),
  edition_key text not null default '' check (edition_key = '' or edition_key ~ '^OL[0-9]+M$'),
  title text not null check (length(trim(title)) between 1 and 300),
  author text not null default '' check (length(author) <= 500),
  cover_id integer,
  saved_at timestamptz not null default now(),
  unique (student_id, work_key)
);

alter table public.student_saved_books enable row level security;
revoke all on public.student_saved_books from anon, authenticated;
