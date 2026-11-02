alter table public.assignments
  add column if not exists maximum_score numeric(8,2) not null default 100 check (maximum_score > 0);

alter table public.assignment_submissions
  drop constraint if exists assignment_submissions_status_check;
alter table public.assignment_submissions
  add constraint assignment_submissions_status_check check (status in ('submitted','late','reviewed','returned'));
alter table public.assignment_submissions
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.assignment_drafts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  answer text not null default '',
  attachment_path text,
  attachment_name text,
  updated_at timestamptz not null default now(),
  unique(assignment_id, student_id)
);

create table if not exists public.student_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  category text not null check (category in ('attendance','profile')),
  attendance_record_id uuid references public.attendance_records(id) on delete set null,
  requested_status text check (requested_status in ('present','absent','excused','late')),
  requested_changes jsonb not null default '{}'::jsonb,
  message text not null check (length(trim(message)) between 5 and 2000),
  status text not null default 'open' check (status in ('open','approved','declined')),
  staff_response text not null default '',
  handled_by uuid references auth.users(id),
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  check ((category='attendance' and attendance_record_id is not null and requested_status is not null)
      or (category='profile' and attendance_record_id is null and requested_status is null))
);
create index if not exists student_requests_status_created_idx on public.student_requests(status, created_at desc);

alter table public.assignment_drafts enable row level security;
alter table public.student_requests enable row level security;
revoke all on public.assignment_drafts, public.student_requests from anon, authenticated;
grant all on public.assignment_drafts, public.student_requests to service_role;

create or replace function public.save_assignment_draft(
  p_assignment_id uuid, p_student_id uuid, p_user_id uuid,
  p_answer text, p_attachment_path text, p_attachment_name text
)
returns table(id uuid, answer text, attachment_name text, updated_at timestamptz)
language plpgsql
set search_path = ''
as $$
declare student_row public.students%rowtype; assignment_row public.assignments%rowtype; existing_status text;
begin
  select * into student_row from public.students where students.id=p_student_id and students.user_id=p_user_id;
  if not found then raise exception 'Student profile not found.'; end if;
  select * into assignment_row from public.assignments where assignments.id=p_assignment_id and assignments.is_published;
  if not found then raise exception 'Assignment not found.'; end if;
  if assignment_row.class_level<>student_row.class_level or
    (assignment_row.stream<>'' and assignment_row.stream<>student_row.stream) or
    (assignment_row.term<>'' and assignment_row.term<>student_row.current_term) then
    raise exception 'This assignment is not assigned to your class.';
  end if;
  if assignment_row.submission_method<>'online' then raise exception 'This assignment must be handed in during class.'; end if;
  if length(coalesce(p_answer,''))>50000 then raise exception 'Answers must be 50,000 characters or fewer.'; end if;
  select status into existing_status from public.assignment_submissions
    where assignment_submissions.assignment_id=p_assignment_id and assignment_submissions.student_id=p_student_id;
  if existing_status in ('submitted','late','reviewed') then raise exception 'This assignment has already been submitted.'; end if;
  return query
    insert into public.assignment_drafts(assignment_id,student_id,answer,attachment_path,attachment_name,updated_at)
    values(p_assignment_id,p_student_id,coalesce(p_answer,''),p_attachment_path,p_attachment_name,now())
    on conflict(assignment_id,student_id) do update set answer=excluded.answer,
      attachment_path=coalesce(excluded.attachment_path,assignment_drafts.attachment_path),
      attachment_name=coalesce(excluded.attachment_name,assignment_drafts.attachment_name),updated_at=now()
    returning assignment_drafts.id,assignment_drafts.answer,assignment_drafts.attachment_name,assignment_drafts.updated_at;
end;
$$;

create or replace function public.submit_assignment(
  p_assignment_id uuid, p_student_id uuid, p_user_id uuid, p_answer text,
  p_attachment_path text default null, p_attachment_name text default null
)
returns table(created boolean, id uuid, status text, answer text, submitted_at timestamptz, attachment_name text)
language plpgsql
set search_path = ''
as $$
declare student_row public.students%rowtype; assignment_row public.assignments%rowtype;
  submission_row public.assignment_submissions%rowtype; is_late boolean;
begin
  if nullif(trim(coalesce(p_answer,'')),'') is null and p_attachment_path is null then
    raise exception 'Enter an answer or attach a file before submitting.';
  end if;
  if length(coalesce(p_answer,''))>50000 then raise exception 'Answers must be 50,000 characters or fewer.'; end if;
  select * into student_row from public.students where students.id=p_student_id and students.user_id=p_user_id;
  if not found then raise exception 'Student profile not found.'; end if;
  select * into assignment_row from public.assignments where assignments.id=p_assignment_id for update;
  if not found or not assignment_row.is_published then raise exception 'Assignment not found.'; end if;
  if assignment_row.class_level<>student_row.class_level or
    (assignment_row.stream<>'' and assignment_row.stream<>student_row.stream) or
    (assignment_row.term<>'' and assignment_row.term<>student_row.current_term) then
    raise exception 'This assignment is not assigned to your class.';
  end if;
  if assignment_row.submission_method<>'online' then raise exception 'This assignment must be handed in during class.'; end if;
  is_late=assignment_row.due_at is not null and now()>assignment_row.due_at;
  if is_late and not assignment_row.late_allowed then raise exception 'The due date has passed and late work is not accepted.'; end if;
  select * into submission_row from public.assignment_submissions
    where assignment_submissions.assignment_id=p_assignment_id and assignment_submissions.student_id=p_student_id for update;
  if found then
    if submission_row.status<>'returned' then raise exception 'This assignment has already been submitted.'; end if;
    update public.assignment_submissions set submitted_by=p_user_id,answer=trim(coalesce(p_answer,'')),
      attachment_path=coalesce(p_attachment_path,submission_row.attachment_path),attachment_name=coalesce(p_attachment_name,submission_row.attachment_name),
      status=case when is_late then 'late' else 'submitted' end,submitted_at=now(),updated_at=now(),
      teacher_feedback='',score=null,reviewed_by=null,reviewed_at=null
      where assignment_submissions.id=submission_row.id returning * into submission_row;
  else
    insert into public.assignment_submissions(assignment_id,student_id,submitted_by,answer,status,attachment_path,attachment_name,updated_at)
      values(p_assignment_id,p_student_id,p_user_id,trim(coalesce(p_answer,'')),case when is_late then 'late' else 'submitted' end,p_attachment_path,p_attachment_name,now())
      returning * into submission_row;
  end if;
  delete from public.assignment_drafts where assignment_drafts.assignment_id=p_assignment_id and assignment_drafts.student_id=p_student_id;
  return query select true,submission_row.id,submission_row.status,submission_row.answer,submission_row.submitted_at,submission_row.attachment_name;
end;
$$;

revoke all on function public.save_assignment_draft(uuid,uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.save_assignment_draft(uuid,uuid,uuid,text,text,text) to service_role;
revoke all on function public.submit_assignment(uuid,uuid,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_assignment(uuid,uuid,uuid,text,text,text) to service_role;
