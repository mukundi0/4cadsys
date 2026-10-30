-- Run after creating an auto-confirmed Supabase Auth user with this email:
-- mukundi.student@example.com
-- The script links the Auth account and creates sample portal records.
begin;

do $$
declare
  v_user_id uuid;
  v_student_id uuid;
  v_invoice_id uuid;
begin
  select id into v_user_id
  from auth.users
  where lower(email) = 'mukundi.student@example.com';

  if v_user_id is null then
    raise exception 'Create the Auth user mukundi.student@example.com before running this seed.';
  end if;

  insert into public.profiles (id, role, username, first_name, last_name)
  values (v_user_id, 'student', 'mukundi.student', 'Demo', 'Student')
  on conflict (id) do update
  set role = excluded.role,
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name;

  insert into public.students
    (user_id, admission_number, class_level, stream, curriculum, current_term)
  values
    (v_user_id, 'DEMO-28210303', 'Year 7', 'A', 'International', 'Term 3 2026')
  on conflict (user_id) do update
  set admission_number = excluded.admission_number,
      class_level = excluded.class_level,
      stream = excluded.stream,
      curriculum = excluded.curriculum,
      current_term = excluded.current_term
  returning id into v_student_id;

  insert into public.attendance_records (student_id, date, term, status, verified, note)
  values
    (v_student_id, '2026-10-27', 'Term 3 2026', 'present', true, 'Demo attendance record'),
    (v_student_id, '2026-10-28', 'Term 3 2026', 'present', true, 'Demo attendance record'),
    (v_student_id, '2026-10-29', 'Term 3 2026', 'present', true, 'Demo attendance record')
  on conflict (student_id, date) do update
  set status = excluded.status, verified = excluded.verified, note = excluded.note;

  insert into public.lessons (class_level, stream, term, weekday, start_time, end_time, subject, teacher_name, room)
  select 'Year 7', 'A', 'Term 3 2026', lesson.weekday, lesson.start_time, lesson.end_time,
         lesson.subject, lesson.teacher_name, lesson.room
  from (values
    (4::smallint, time '08:00', time '08:40', 'Mathematics', 'Ms. Wanjiku', 'Room 7'),
    (4::smallint, time '08:50', time '09:30', 'English', 'Mr. Otieno', 'Room 7')
  ) as lesson(weekday, start_time, end_time, subject, teacher_name, room)
  where not exists (
    select 1 from public.lessons existing
    where existing.class_level = 'Year 7' and existing.stream = 'A'
      and existing.term = 'Term 3 2026' and existing.weekday = lesson.weekday
      and existing.start_time = lesson.start_time and existing.subject = lesson.subject
  );

  insert into public.invoices (student_id, term, invoice_number, issued_on, due_on, status)
  values (v_student_id, 'Term 3 2026', 'DEMO-INV-2026-001', '2026-10-30', '2026-11-15', 'issued')
  on conflict (invoice_number) do update
  set student_id = excluded.student_id,
      term = excluded.term,
      issued_on = excluded.issued_on,
      due_on = excluded.due_on,
      status = excluded.status
  returning id into v_invoice_id;

  insert into public.invoice_lines (invoice_id, description, amount)
  select v_invoice_id, line.description, line.amount
  from (values
    ('Tuition - demo', 30000::numeric),
    ('Meals - demo', 7000::numeric),
    ('Transport - demo', 8000::numeric)
  ) as line(description, amount)
  where not exists (
    select 1 from public.invoice_lines existing
    where existing.invoice_id = v_invoice_id and existing.description = line.description
  );
end;
$$;

commit;
