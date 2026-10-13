# School management system: conversation handoff

## How to collaborate

The user is a beginner learning by building. Guide them through small steps,
explain commands and file changes, and verify each milestone before advancing.
The previous desktop chat could not be resumed in the VS Code terminal:
"This conversation is read-only or unavailable; no operation was sent."
Continue from this document and the actual files. Do not assume proposed features
have been implemented. Never print .env contents or passwords.

## Goal and scope

Build a configurable academic management web application that any school could
adopt. Visionary School supplied example workflows; do not hard-code its name or
policies. Supporting separate installations per school versus hosting multiple
schools in one installation is still undecided.

Initial curriculum examples: Kenyan 8-4-4 Form 1-4; international KG1-Year 11
and A Levels. CBC was explicitly deferred. Curricula, levels, grading, report
formats, school branding and policies should be configurable.

## Agreed workflows

### Admissions
- Create an applicant with an application reference, guardian contacts and
  intended curriculum/class.
- Upload identity documents, leaving letter and previous grades/reports.
- Written interview tests Maths, English and Sciences. Any teacher can mark;
  record marks, maximum marks, marker and comments separately by subject.
- Admission considers interview scores, previous grades and observations.
- Principal approves admissions; acceptance is not automatic from exam totals.
- Contact guardian after the decision; track contact history.
- Admission number requires all three: principal approval, physical reporting
  and verified payment meeting the initial payment requirement.
- Link pre-enrolment payments to the applicant reference and retain history.

### Finance
- Term billing; tuition varies by curriculum and class. Initial example school
  has day scholars only; boarding is not in the initial scope.
- Instalments allowed. Fees include tuition, optional meals, optional transport,
  admission and caution fees. Transport varies by route.
- Full term charges apply even for midterm enrolment.
- Track meal/transport selections per term and preserve historical invoices.
- Parents pay through M-Pesa or bank and can upload proof. Accountant verifies
  before crediting balances and issuing a school receipt.
- Detect duplicate transaction references. One itemised student statement.
- Initial payment can be a configurable percentage or an individually agreed
  amount approved by accounts with a reason. Individual amount overrides the
  standard requirement.
- User delegated choosing the percentage basis: full first-term invoice,
  including applicable extras. Percentage value remains unset. Later invoice
  changes should flag an existing payment agreement for review.
- Caution fee refund rules, instalment deadlines and payment allocation rules
  remain to be established. "Cution" was interpreted as caution fee.
- Direct payment-provider integration is future work; start with verification.

### Academics and reports
- Midterm and end-of-term exam sessions, with separate session reports; no
  combined weighting rule was agreed.
- Teachers have assigned subjects/classes. Multiple streams per class/year,
  each with a class teacher; a teacher may also teach subjects across streams.
- Optional-subject groups stay within their stream; do not combine streams.
- Proposed report defaults: student/school/exam details, subject marks and
  maximum marks, grades, subject comments, overall results where appropriate,
  attendance, class teacher/principal feedback, term dates and approval details.
- Proposed publication flow: subject teacher submission, class teacher review,
  principal approval. Ranking optional/off initially. Missing marks must not
  silently become zero. Early-years reports may need descriptive assessments.
- These report details were suggestions, not existing school policy.

### Attendance
- One daily register per stream, not lesson-level attendance.
- Staff verify absences before they count toward notifications.
- User accepted notifying parents at >=33% verified absence, including excused
  absence, after at least 10 school days from the student's first day that term.
- Denominator is school days held during the student's enrolled period;
  exclude holidays and pre-enrolment days. Rules configurable.
- Notification repeat/reset policy remains unresolved; avoid duplicate alerts.

### Timetables and portals
- Generate timetable automatically, then allow staff review/edit/approval.
- Inputs: school-day structure, weekly lesson allocations, teacher assignments
  and availability, rooms and double periods. Actual allocations are unknown.
- Enforce teacher, student-group and room constraints; explain infeasibility.
- Separate parent/student accounts were proposed after a brief "yes" response.
  Parents see linked children; students see their own authorised information.
- Parents can upload payment proof and update their own contact details.
  Guardian access changes should be handled by school staff.

## Stack and verified progress

- Windows PowerShell workspace: C:\Users\MUKUNDI\Desktop\ams
- Python 3.13 with root .venv; Django 5.2 range and Django REST Framework installed.
- backend/config contains the Django project.
- PostgreSQL 17 via root compose.yaml, credentials in root .env; user confirmed
  migrations succeeded and Django welcome page worked.
- React + TypeScript + Vite in frontend; Node v26.3.0/npm 11.16.0 observed.
- Docker engine 28.3.0 and Compose v2.38.1 confirmed running by user.
- Git and VS Code installed; repository initialisation not confirmed.
- Intended later: Tailwind/shadcn, OR-Tools scheduling, Celery/Redis background
  tasks, private S3-compatible documents and Docker deployment. Not yet set up.
- Vite failed because @rolldown/binding-win32-x64-msvc was missing. Repaired with
  npm.cmd install --no-save --package-lock=false --include=optional
  @rolldown/binding-win32-x64-msvc@1.2.13
  (download required network approval). Frontend production build passed and
  Vite started. User confirmed everything working. Binding version must match
  the installed rolldown version for future repairs; not an app dependency.

## Immediate next milestone

Connect React to Django via a simple GET /api/health/ JSON endpoint and Vite
development proxy for /api -> http://127.0.0.1:8000. Explain each step.
Instructions were supplied in desktop chat but NOT implemented as of inspection:
- backend/config/urls.py still contains only admin/.
- frontend/vite.config.ts has only plugins: [react()].
- frontend/src/App.tsx is still the starter page.
Verify the endpoint directly, then show its response in React. This verifies
frontend/backend connectivity; it does not itself verify database connectivity.

## Useful commands

From workspace root:
```powershell
.\.venv\Scripts\Activate.ps1
docker compose up -d db
python backend/manage.py runserver
```
From a separate terminal:
```powershell
cd C:\Users\MUKUNDI\Desktop\ams\frontend
npm.cmd run dev
```

Use npm.cmd in PowerShell to avoid npm.ps1 execution-policy issues. Keep .env,
.venv, node_modules and generated outputs out of source control. Inspect actual
files before editing, and preserve user changes.

## React–Django connection completed (2026-10-13)

- Added GET /api/health/ in backend/config/urls.py. Returns status ok and a connection message; does not query the database.
- Added Vite development proxy for /api to http://127.0.0.1:8000. Production API routing still needs deployment configuration.
- Replaced the React starter page with a connection status page, including loading and failure messages and request cleanup.
- Verified HTTP 200 and expected JSON directly on port 8000 and through Vite on port 5173. TypeScript check and Vite production build passed.
- A separate Django check command could not launch because access to the underlying Python executable was denied in the agent session; the existing Django server successfully served the endpoint.
- Next learning step: user opens http://localhost:5173 and confirms “Django is connected!” before proceeding to a new feature.

## Git and setup documentation (2026-10-13)

- Git repository initialized on main. Initial commit: 601cb6f, authored by Mukundi, with no AI co-author credits. User requested no AI contributor attribution for future commits too.
- origin: https://github.com/mukundi0/4cadsys.git. Local origin/main matches the initial commit following the user's push.
- Current setup work is on chore/project-setup: root README.md and backend/requirements.txt record local setup and installed package versions.
- Django SECRET_KEY now loads DJANGO_SECRET_KEY from ignored root .env; the existing key was preserved locally. .env.example has placeholders.
- Agent Git commands need a per-command safe.directory exception for this workspace because the sandbox and Windows accounts differ.
- Agent network cannot reach GitHub port 443; pushing from the user's terminal worked for initial main. Do not claim later commits uploaded without verification.
