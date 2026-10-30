# School management system handoff

## Current stack

- React, TypeScript, and Vite frontend in `frontend/`.
- Supabase Auth, Postgres, Storage, and Edge Functions in `backend/supabase/`.
- Django and its local virtual environment have been removed. Supabase is the only application backend.
- Supabase project ref: `zqyxpfvvwhphzomjnmnc`.

## Run locally

From the frontend folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

The ignored `frontend/.env.local` file needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put a service-role or secret key in a `VITE_` variable.

## Supabase deployment

The schema is in `backend/supabase/migrations/202610290001_school_schema.sql`. The `school-api` and `daraja-callback` Edge Functions are in `backend/supabase/functions/`. Run Supabase CLI commands with `--workdir backend`. Configure payment and email provider secrets with Supabase project secrets when those features are enabled.

## Current data and limitations

- The hosted project has the school-management schema, row-level security, private `school-private` bucket, and both Edge Functions deployed.
- The hosted demo school is `Demo School` (`demo@example.com`) with a demo admin account.
- The old published welcome assignment was copied into Supabase. The `Groombridge` school profile, student record, and student account were not migrated; the hosted `Demo School` profile and demo admin were kept. The deleted Django password cannot be used to sign in.
- The student portal, staff dashboards, admissions, finance, enrolment, attendance, reports, timetable, and private file workflows use Supabase Edge Functions. Guardian-facing UI, live Daraja credentials, and email delivery configuration remain outstanding.

