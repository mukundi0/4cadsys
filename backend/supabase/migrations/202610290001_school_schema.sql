-- Supabase replacement schema for the Django school-management models.
create extension if not exists pgcrypto;

create type public.user_role as enum ('student','guardian','teacher','staff','principal','accounts','admin');
create table public.school_profile (id boolean primary key default true check (id), name text not null, email text not null default '', phone text not null default '', postal_address text not null default '');
create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, role public.user_role not null default 'student', username text unique, first_name text not null default '', last_name text not null default '', created_at timestamptz not null default now());
create table public.students (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, admission_number text not null unique, class_level text not null, stream text not null default '', curriculum text not null default '', current_term text not null default '', first_day_of_term date);
create table public.guardians (id uuid primary key default gen_random_uuid(), user_id uuid unique not null references public.profiles(id) on delete cascade, phone text not null default '', email text not null default '');
create table public.guardian_student_links (id uuid primary key default gen_random_uuid(), guardian_id uuid not null references public.guardians(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade, relationship text not null default '', can_view_finances boolean not null default true, can_view_reports boolean not null default true, created_at timestamptz not null default now(), unique(guardian_id,student_id));
create table public.assignments (id uuid primary key default gen_random_uuid(), title text not null, subject text not null, teacher_name text not null default '', class_level text not null, stream text not null default '', term text not null default '', due_at timestamptz, submission_method text not null default 'in_class' check(submission_method in ('online','in_class')), late_allowed boolean not null default false, instructions text not null default '', is_published boolean not null default false, created_at timestamptz not null default now());
create table public.assignment_submissions (id uuid primary key default gen_random_uuid(), assignment_id uuid not null references public.assignments(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade, submitted_by uuid not null references auth.users(id), answer text not null, submitted_at timestamptz not null default now(), status text not null default 'submitted' check(status in ('submitted','late','reviewed')), teacher_feedback text not null default '', score numeric(8,2), reviewed_by uuid references auth.users(id), reviewed_at timestamptz, unique(assignment_id,student_id));
create table public.announcements (id uuid primary key default gen_random_uuid(), title text not null, body text not null, category text not null default '', class_level text not null default '', stream text not null default '', term text not null default '', published boolean not null default false, created_at timestamptz not null default now(), published_at timestamptz, created_by uuid references auth.users(id));
create table public.lessons (id uuid primary key default gen_random_uuid(), class_level text not null, stream text not null default '', term text not null default '', weekday smallint not null check(weekday between 0 and 6), start_time time not null, end_time time not null check(end_time>start_time), subject text not null, teacher_name text not null default '', room text not null default '');
create table public.attendance_records (id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade, date date not null, term text not null, status text not null check(status in ('present','absent','excused','late')), verified boolean not null default false, note text not null default '', recorded_by uuid references auth.users(id), verified_by uuid references auth.users(id), created_at timestamptz not null default now(), unique(student_id,date));
create table public.report_sessions (id uuid primary key default gen_random_uuid(), title text not null, term text not null, period text not null check(period in ('midterm','end_term')), class_level text not null, stream text not null default '', published boolean not null default false, starts_on date, ends_on date);
create table public.student_reports (id uuid primary key default gen_random_uuid(), session_id uuid not null references public.report_sessions(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade, status text not null default 'draft' check(status in ('draft','review','approved','published')), class_teacher_comment text not null default '', principal_comment text not null default '', updated_at timestamptz not null default now(), unique(session_id,student_id));
create table public.subject_results (id uuid primary key default gen_random_uuid(), report_id uuid not null references public.student_reports(id) on delete cascade, subject text not null, mark numeric(8,2), maximum_mark numeric(8,2) not null check(maximum_mark>0), grade text not null default '', teacher_comment text not null default '', unique(report_id,subject), check(mark is null or (mark>=0 and mark<=maximum_mark)));
create table public.applicants (id uuid primary key default gen_random_uuid(), application_reference text not null unique, first_name text not null, last_name text not null, date_of_birth date, guardian_name text not null, guardian_email text not null default '', guardian_phone text not null, curriculum text not null, intended_class text not null, term text not null, previous_school text not null default '', previous_grades text not null default '', observation text not null default '', status text not null default 'received' check(status in ('received','documents','interview','decision','accepted','hold','declined','enrolled')), principal_decision text not null default 'pending' check(principal_decision in ('pending','accepted','hold','declined')), decision_note text not null default '', decision_by uuid references auth.users(id), decision_at timestamptz, created_at timestamptz not null default now());
create table public.invoices (id uuid primary key default gen_random_uuid(), student_id uuid references public.students(id), applicant_id uuid references public.applicants(id), term text not null, invoice_number text not null unique, issued_on date, due_on date, status text not null default 'draft' check(status in ('draft','issued','paid','void')), created_at timestamptz not null default now(), check((student_id is null) <> (applicant_id is null)));
create table public.invoice_lines (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id) on delete cascade, description text not null, amount numeric(12,2) not null check(amount>=0));
create table public.payments (id uuid primary key default gen_random_uuid(), invoice_id uuid references public.invoices(id), applicant_id uuid references public.applicants(id), amount numeric(12,2) not null check(amount>0), method text not null check(method in ('mpesa','bank','cash','other')), transaction_reference text not null unique, paid_at timestamptz, status text not null default 'pending' check(status in ('pending','verified','rejected')), receipt_number text unique, note text not null default '', proof_path text, provider_checkout_id text not null default '', verified_by uuid references auth.users(id), verified_at timestamptz, created_at timestamptz not null default now(), check((invoice_id is null) <> (applicant_id is null)));
create table public.enrolment_cases (id uuid primary key default gen_random_uuid(), applicant_id uuid not null unique references public.applicants(id) on delete cascade, principal_approved boolean not null default false, principal_approved_by uuid references auth.users(id), principal_approved_at timestamptz, physically_reported boolean not null default false, reported_at timestamptz, reporting_officer uuid references auth.users(id), initial_payment_verified boolean not null default false, verified_payment_id uuid references public.payments(id), approved_initial_amount numeric(12,2) check(approved_initial_amount is null or approved_initial_amount>0), amount_override_reason text not null default '', amount_approved_by uuid references auth.users(id), amount_policy_review_required boolean not null default false, payment_basis_invoice_total numeric(12,2) check(payment_basis_invoice_total is null or payment_basis_invoice_total>=0), student_id uuid unique references public.students(id), updated_at timestamptz not null default now(), check(approved_initial_amount is null or payment_basis_invoice_total is null or approved_initial_amount<=payment_basis_invoice_total));
create table public.applicant_documents (id uuid primary key default gen_random_uuid(), applicant_id uuid not null references public.applicants(id) on delete cascade, document_type text not null, storage_path text not null, uploaded_at timestamptz not null default now(), verified boolean not null default false, verified_by uuid references auth.users(id));
create table public.interview_scores (id uuid primary key default gen_random_uuid(), applicant_id uuid not null references public.applicants(id) on delete cascade, subject text not null, mark numeric(8,2), maximum_mark numeric(8,2) not null, marker uuid references auth.users(id), comment text not null default '', unique(applicant_id,subject));
create table public.school_calendar_days (id uuid primary key default gen_random_uuid(), term text not null, date date not null, kind text not null default 'school' check(kind in ('school','holiday')), label text not null default '', unique(term,date));
create table public.parent_notifications (id uuid primary key default gen_random_uuid(), guardian_id uuid not null references public.guardians(id) on delete cascade, student_id uuid not null references public.students(id) on delete cascade, term text not null, title text not null, body text not null, created_at timestamptz not null default now(), read_at timestamptz, email_sent_at timestamptz, email_error text not null default '');
create table public.teacher_assignments (id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id) on delete cascade, role text not null check(role in ('class','subject')), class_level text not null, stream text not null default '', subject text not null default '', term text not null);
create table public.timetable_requirements (id uuid primary key default gen_random_uuid(), class_level text not null, stream text not null default '', term text not null, subject text not null, teacher_id uuid not null references public.profiles(id), room text not null default '', periods_per_week smallint not null check(periods_per_week>0), double_periods smallint not null default 0 check(double_periods>=0 and double_periods*2<=periods_per_week));
create table public.teacher_availability (id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id), weekday smallint not null check(weekday between 0 and 6), period smallint not null check(period>=0), available boolean not null default true, unique(teacher_id,weekday,period));
create table public.timetable_configurations (id uuid primary key default gen_random_uuid(), term text not null unique, weekdays text not null default '0,1,2,3,4', periods_per_day smallint not null default 8 check(periods_per_day>0), period_minutes smallint not null default 40 check(period_minutes>0), day_starts_at time not null default '08:00', break_after_periods text not null default '', approved boolean not null default false);
create table public.initial_payment_policies (id uuid primary key default gen_random_uuid(), term text not null unique, minimum_percent numeric(5,2) check(minimum_percent is null or (minimum_percent>0 and minimum_percent<=100)), updated_at timestamptz not null default now());
create table public.applicant_contacts (id uuid primary key default gen_random_uuid(), applicant_id uuid not null references public.applicants(id) on delete cascade, contacted_by uuid references auth.users(id), channel text not null default 'phone', summary text not null, contacted_at timestamptz not null default now());
create table public.attendance_alert_policies (id uuid primary key default gen_random_uuid(), term text not null unique, absence_percent numeric(5,2) not null default 33 check(absence_percent>0 and absence_percent<=100), minimum_school_days smallint not null default 10 check(minimum_school_days>0), enabled boolean not null default true);
create table public.absence_alerts (id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade, guardian_id uuid not null references public.guardians(id) on delete cascade, term text not null, absence_percent numeric(5,2) not null, school_days_counted smallint not null, created_at timestamptz not null default now(), unique(student_id,guardian_id,term));
create table public.payment_attempts (id uuid primary key default gen_random_uuid(), invoice_id uuid not null references public.invoices(id), phone text not null, amount numeric(12,2) not null check(amount>0), checkout_id text not null unique, merchant_request_id text not null default '', status text not null default 'initiated' check(status in ('initiated','success','failed','cancelled')), result_code text not null default '', result_description text not null default '', created_at timestamptz not null default now(), completed_at timestamptz);

create index students_class_stream_idx on public.students(class_level,stream,current_term);
create index assignments_class_term_idx on public.assignments(class_level,stream,term,is_published);
create index attendance_student_term_date_idx on public.attendance_records(student_id,term,date desc);
create index invoices_student_term_idx on public.invoices(student_id,term,status);
create index invoices_applicant_term_idx on public.invoices(applicant_id,term,status);
create index payments_invoice_status_idx on public.payments(invoice_id,status);
create index reports_student_status_idx on public.student_reports(student_id,status);
create index lessons_class_term_idx on public.lessons(class_level,stream,term,weekday,start_time);

-- Keep generation and publication all-or-nothing. Edge Functions call these RPCs
-- with the server-only key only after solving/authorizing the requested action.
create or replace function public.replace_generated_lessons(p_term text, p_lessons jsonb)
returns table(id uuid)
language plpgsql
set search_path = ''
as $$
begin
  if p_lessons is null or jsonb_typeof(p_lessons) <> 'array' then raise exception 'Lessons must be an array.'; end if;
  perform 1 from public.timetable_configurations where term=p_term for update;
  if not found then raise exception 'Timetable configuration not found.'; end if;
  delete from public.lessons where term = p_term;
  return query
    insert into public.lessons as target(class_level,stream,term,weekday,start_time,end_time,subject,teacher_name,room)
    select x.class_level,coalesce(x.stream,''),p_term,x.weekday,x.start_time,x.end_time,x.subject,coalesce(x.teacher_name,''),coalesce(x.room,'')
    from jsonb_to_recordset(p_lessons) as x(class_level text,stream text,weekday smallint,start_time time,end_time time,subject text,teacher_name text,room text)
    returning target.id;
  update public.timetable_configurations set approved=false where term=p_term;
end;
$$;

create or replace function public.publish_report_session(p_session_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
declare report_count integer; pending_count integer; already_published boolean;
begin
  select published into already_published from public.report_sessions where id=p_session_id for update;
  if not found then raise exception 'Report session not found.'; end if;
  if already_published then raise exception 'This report session has already been published.'; end if;
  perform 1 from public.student_reports where session_id=p_session_id for update;
  select count(*) into report_count from public.student_reports where session_id=p_session_id;
  select count(*) into pending_count from public.student_reports where session_id=p_session_id and status <> 'approved';
  if report_count=0 or pending_count>0 then raise exception 'Approve every student report before publishing.'; end if;
  update public.student_reports set status='published',updated_at=now() where session_id=p_session_id;
  update public.report_sessions set published=true where id=p_session_id;
  return true;
end;
$$;

create or replace function public.create_invoice_with_lines(
  p_student_id uuid, p_applicant_id uuid, p_term text, p_invoice_number text,
  p_due_on date, p_lines jsonb
)
returns table(invoice_id uuid, invoice_number text)
language plpgsql
set search_path = ''
as $$
declare new_id uuid;
begin
  if (p_student_id is null) = (p_applicant_id is null) then raise exception 'Choose exactly one student or applicant.'; end if;
  if p_term is null or p_term='' or p_invoice_number is null or p_invoice_number='' then raise exception 'Invoice number and term are required.'; end if;
  if p_lines is null or jsonb_typeof(p_lines)<>'array' or jsonb_array_length(p_lines)=0 then raise exception 'Invoice lines are required.'; end if;
  if exists(select 1 from jsonb_to_recordset(p_lines) as x(description text, amount numeric) where x.amount is null or x.amount<0) then raise exception 'Invoice line amounts cannot be negative.'; end if;
  insert into public.invoices(student_id,applicant_id,term,invoice_number,issued_on,due_on,status)
  values(p_student_id,p_applicant_id,p_term,p_invoice_number,(now() at time zone 'Africa/Nairobi')::date,p_due_on,'issued')
  returning id into new_id;
  insert into public.invoice_lines(invoice_id,description,amount)
  select new_id,coalesce(nullif(left(x.description,200),''),'Charge'),x.amount
  from jsonb_to_recordset(p_lines) as x(description text, amount numeric);
  return query select new_id,p_invoice_number;
end;
$$;

create or replace function public.replace_invoice_lines(p_invoice_id uuid, p_lines jsonb)
returns numeric
language plpgsql
set search_path = ''
as $$
declare invoice_row public.invoices%rowtype; new_total numeric(12,2); verified_total numeric(12,2);
begin
  if p_lines is null or jsonb_typeof(p_lines)<>'array' then raise exception 'Provide updated invoice lines.'; end if;
  if exists(select 1 from jsonb_to_recordset(p_lines) as x(description text,amount numeric)
    where x.amount is null or x.amount<0 or x.amount<>round(x.amount,2)) then
    raise exception 'Invoice amounts must be non-negative and have at most two decimal places.';
  end if;
  select * into invoice_row from public.invoices where invoices.id=p_invoice_id for update;
  if not found then raise exception 'Invoice not found.'; end if;
  if invoice_row.status in ('paid','void') then raise exception 'Paid or void invoices cannot be edited.'; end if;
  select coalesce(sum(x.amount),0) into new_total from jsonb_to_recordset(p_lines) as x(description text,amount numeric);
  select coalesce(sum(payments.amount),0) into verified_total from public.payments
    where payments.invoice_id=p_invoice_id and payments.status='verified';
  if new_total<verified_total then raise exception 'Invoice total cannot be less than payments already verified.'; end if;
  delete from public.invoice_lines where invoice_lines.invoice_id=p_invoice_id;
  insert into public.invoice_lines(invoice_id,description,amount)
    select p_invoice_id,coalesce(nullif(left(x.description,200),''),'Charge'),x.amount
    from jsonb_to_recordset(p_lines) as x(description text,amount numeric);
  return new_total;
end;
$$;

-- Serialize payment review around the invoice so simultaneous reviews cannot
-- accept more than the outstanding balance.
create or replace function public.review_payment(
  p_payment_id uuid, p_decision text, p_user_id uuid, p_receipt_number text
)
returns table(id uuid, status text, invoice_id uuid, applicant_id uuid, student_id uuid, receipt_number text)
language plpgsql
set search_path = ''
as $$
declare
  payment_row public.payments%rowtype;
  invoice_row public.invoices%rowtype;
  applicant_term text;
  invoice_total numeric(12,2);
  verified_total numeric(12,2);
begin
  if p_decision not in ('verified','rejected') then raise exception 'Choose verified or rejected.'; end if;
  select * into payment_row from public.payments where payments.id=p_payment_id for update;
  if not found then raise exception 'Payment not found.'; end if;
  if payment_row.status <> 'pending' then raise exception 'This payment has already been reviewed.'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'school-payment:' || coalesce(payment_row.applicant_id::text,
      (select invoices.applicant_id::text from public.invoices where invoices.id=payment_row.invoice_id),
      payment_row.invoice_id::text), 0));

  if p_decision='verified' and payment_row.invoice_id is not null then
    select * into invoice_row from public.invoices where invoices.id=payment_row.invoice_id for update;
    if not found or invoice_row.status not in ('issued','paid') then raise exception 'Invoice is unavailable for payment verification.'; end if;
    select coalesce(sum(amount),0) into invoice_total from public.invoice_lines where invoice_lines.invoice_id=invoice_row.id;
    select coalesce(sum(amount),0) into verified_total from public.payments where payments.invoice_id=invoice_row.id and payments.status='verified';
    if payment_row.amount > invoice_total-verified_total then raise exception 'Verifying this payment would exceed the remaining invoice balance.'; end if;
  elsif p_decision='verified' and payment_row.applicant_id is not null then
    select term into applicant_term from public.applicants where applicants.id=payment_row.applicant_id;
    select * into invoice_row from public.invoices
      where invoices.applicant_id=payment_row.applicant_id and invoices.term=applicant_term and invoices.status in ('issued','paid')
      order by invoices.created_at asc limit 1 for update;
    if not found then raise exception 'Create the applicant first-term invoice before verifying this payment.'; end if;
    select coalesce(sum(amount),0) into invoice_total from public.invoice_lines where invoice_lines.invoice_id=invoice_row.id;
    select coalesce(sum(payments.amount),0) into verified_total from public.payments
      left join public.invoices on invoices.id=payments.invoice_id
      where payments.status='verified' and (payments.applicant_id=payment_row.applicant_id or (invoices.applicant_id=payment_row.applicant_id and invoices.term=applicant_term));
    if payment_row.amount > invoice_total-verified_total then raise exception 'Verifying this payment would exceed the applicant first-term balance.'; end if;
  end if;

  update public.payments set status=p_decision, verified_by=p_user_id,
    verified_at=case when p_decision='verified' then now() else null end,
    receipt_number=case when p_decision='verified' then p_receipt_number else null end
    where payments.id=p_payment_id;

  if p_decision='verified' and payment_row.invoice_id is not null then
    select coalesce(sum(amount),0) into verified_total from public.payments where payments.invoice_id=payment_row.invoice_id and payments.status='verified';
    if verified_total >= invoice_total then update public.invoices set status='paid' where invoices.id=payment_row.invoice_id; end if;
  end if;

  return query select payment_row.id,p_decision,payment_row.invoice_id,coalesce(payment_row.applicant_id,invoice_row.applicant_id),
    invoice_row.student_id,p_receipt_number;
end;
$$;

create or replace function public.decide_applicant(
  p_applicant_id uuid, p_decision text, p_note text, p_user_id uuid
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare applicant_row public.applicants%rowtype;
begin
  if p_decision not in ('accepted','hold','declined') then raise exception 'Choose a valid admission decision.'; end if;
  select * into applicant_row from public.applicants where applicants.id=p_applicant_id for update;
  if not found then raise exception 'Applicant not found.'; end if;
  update public.applicants set principal_decision=p_decision,status=p_decision,
    decision_note=coalesce(p_note,''),decision_by=p_user_id,decision_at=now()
    where applicants.id=p_applicant_id;
  if p_decision='accepted' then
    insert into public.enrolment_cases(applicant_id,principal_approved,principal_approved_by,principal_approved_at)
      values(p_applicant_id,true,p_user_id,now())
      on conflict(applicant_id) do update set principal_approved=true,
        principal_approved_by=excluded.principal_approved_by,principal_approved_at=excluded.principal_approved_at,
        updated_at=now();
  end if;
  return p_applicant_id;
end;
$$;

create or replace function public.create_report_session(
  p_title text, p_term text, p_period text, p_class_level text, p_stream text
)
returns table(session_id uuid, report_count integer)
language plpgsql
set search_path = ''
as $$
declare new_session_id uuid; new_report_count integer;
begin
  if nullif(trim(p_title),'') is null or nullif(trim(p_term),'') is null or
    nullif(trim(p_class_level),'') is null or p_period is null or p_period not in ('midterm','end_term') then
    raise exception 'Enter title, term, period and class.';
  end if;
  insert into public.report_sessions(title,term,period,class_level,stream)
    values(trim(p_title),trim(p_term),p_period,trim(p_class_level),coalesce(trim(p_stream),''))
    returning id into new_session_id;
  insert into public.student_reports(session_id,student_id)
    select new_session_id,students.id from public.students
    where students.class_level=trim(p_class_level) and students.current_term=trim(p_term)
      and (coalesce(trim(p_stream),'')='' or students.stream=trim(p_stream));
  get diagnostics new_report_count = row_count;
  return query select new_session_id,new_report_count;
end;
$$;

create or replace function public.submit_assignment(
  p_assignment_id uuid, p_student_id uuid, p_user_id uuid, p_answer text
)
returns table(created boolean, id uuid, status text, answer text, submitted_at timestamptz)
language plpgsql
set search_path = ''
as $$
declare student_row public.students%rowtype; assignment_row public.assignments%rowtype;
  submission_row public.assignment_submissions%rowtype; is_late boolean;
begin
  if nullif(trim(p_answer),'') is null then raise exception 'Enter an answer before submitting.'; end if;
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
    where assignment_submissions.assignment_id=p_assignment_id and assignment_submissions.student_id=p_student_id;
  if found then return query select false,submission_row.id,submission_row.status,submission_row.answer,submission_row.submitted_at; return; end if;
  insert into public.assignment_submissions(assignment_id,student_id,submitted_by,answer,status)
    values(p_assignment_id,p_student_id,p_user_id,trim(p_answer),case when is_late then 'late' else 'submitted' end)
    returning * into submission_row;
  return query select true,submission_row.id,submission_row.status,submission_row.answer,submission_row.submitted_at;
end;
$$;

create or replace function public.process_mpesa_callback(
  p_checkout_id text, p_result_code text, p_result_description text,
  p_receipt text, p_amount numeric, p_phone text
)
returns table(status text, result_description text)
language plpgsql
set search_path = ''
as $$
declare attempt_row public.payment_attempts%rowtype; next_status text; next_description text;
begin
  select * into attempt_row from public.payment_attempts
    where payment_attempts.checkout_id=p_checkout_id for update;
  if not found then return query select 'ignored'::text,'No matching payment attempt.'::text; return; end if;
  if attempt_row.status <> 'initiated' then
    return query select attempt_row.status,attempt_row.result_description; return;
  end if;
  next_description=coalesce(p_result_description,'');
  if p_result_code <> '0' then
    next_status='cancelled';
  elsif nullif(trim(coalesce(p_receipt,'')),'') is null or p_amount is distinct from attempt_row.amount or
    (nullif(trim(coalesce(p_phone,'')),'') is not null and p_phone<>attempt_row.phone) then
    next_status='failed';
    next_description='Receipt reference, amount, or phone did not match this payment request.';
  elsif exists(select 1 from public.payments where payments.transaction_reference=p_receipt) then
    next_status='failed';
    next_description='Duplicate M-Pesa receipt reference.';
  else
    begin
      insert into public.payments(invoice_id,amount,method,transaction_reference,paid_at,provider_checkout_id,note)
        values(attempt_row.invoice_id,p_amount,'mpesa',p_receipt,now(),attempt_row.checkout_id,
          'M-Pesa callback received; accounts verification is still required.');
      next_status='success';
    exception when unique_violation then
      next_status='failed';
      next_description='Duplicate M-Pesa receipt reference.';
    end;
  end if;
  update public.payment_attempts set status=next_status,result_code=coalesce(p_result_code,''),
    result_description=next_description,completed_at=now() where payment_attempts.id=attempt_row.id;
  return query select next_status,next_description;
end;
$$;

revoke all on function public.replace_generated_lessons(text,jsonb) from public, anon, authenticated;
revoke all on function public.publish_report_session(uuid) from public, anon, authenticated;
revoke all on function public.create_invoice_with_lines(uuid,uuid,text,text,date,jsonb) from public, anon, authenticated;
revoke all on function public.replace_invoice_lines(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.review_payment(uuid,text,uuid,text) from public, anon, authenticated;
revoke all on function public.decide_applicant(uuid,text,text,uuid) from public, anon, authenticated;
revoke all on function public.create_report_session(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.submit_assignment(uuid,uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.process_mpesa_callback(text,text,text,text,numeric,text) from public, anon, authenticated;
grant execute on function public.replace_generated_lessons(text,jsonb) to service_role;
grant execute on function public.publish_report_session(uuid) to service_role;
grant execute on function public.create_invoice_with_lines(uuid,uuid,text,text,date,jsonb) to service_role;
grant execute on function public.replace_invoice_lines(uuid,jsonb) to service_role;
grant execute on function public.review_payment(uuid,text,uuid,text) to service_role;
grant execute on function public.decide_applicant(uuid,text,text,uuid) to service_role;
grant execute on function public.create_report_session(text,text,text,text,text) to service_role;
grant execute on function public.submit_assignment(uuid,uuid,uuid,text) to service_role;
grant execute on function public.process_mpesa_callback(text,text,text,text,numeric,text) to service_role;

-- A new Auth user gets a harmless student-role profile; school owners must elevate
-- staff roles out of band in the Supabase dashboard or through a trusted admin tool.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, username, first_name, last_name)
  values (new.id, nullif(new.raw_user_meta_data->>'username',''), coalesce(new.raw_user_meta_data->>'first_name',''), coalesce(new.raw_user_meta_data->>'last_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- RLS is enabled everywhere. Browser access is intentionally limited to own profile;
-- domain reads/writes go through authenticated Edge Functions which enforce role checks.
do $$ declare t text; begin
  foreach t in array array['school_profile','profiles','students','guardians','guardian_student_links','assignments','assignment_submissions','announcements','lessons','attendance_records','report_sessions','student_reports','subject_results','applicants','invoices','invoice_lines','payments','enrolment_cases','applicant_documents','interview_scores','school_calendar_days','parent_notifications','teacher_assignments','timetable_requirements','teacher_availability','timetable_configurations','initial_payment_policies','applicant_contacts','attendance_alert_policies','absence_alerts','payment_attempts'] loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;
create policy "users read own profile" on public.profiles for select to authenticated using (id=auth.uid());
-- Profile roles are only changed by trusted project administrators or server functions.
create policy "students read own student row" on public.students for select to authenticated using (user_id=auth.uid());
create policy "guardians read own guardian row" on public.guardians for select to authenticated using (user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('school-private','school-private',false,10485760,array['application/pdf','image/jpeg','image/png'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "private school files require server access" on storage.objects for select to authenticated using (bucket_id='school-private' and false);
