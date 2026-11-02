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
- The student, guardian, staff and administrator portals are implemented in the frontend. Finance entry, report-session creation, attendance policy, school calendar, interview scoring and admission document review are available in staff screens. Live Daraja credentials and email delivery configuration remain outstanding.
- A dedicated administrator area is implemented locally at `/admin`, covering account creation, role changes, suspending/reactivating accounts, school contact details, and the initial-payment policy. Account suspension requires migration `202610310001_profile_account_status.sql` and is enforced by the Edge Function on every authenticated request.
- The frontend production build passes locally. An authenticated admin UI check and a non-admin 403 check were not performed because no signed-in session was available in the browser. Frontend hosting was not identified or deployed as part of this update; publish the frontend separately if its host does not build from this repository automatically. New student and guardian identities need their school-domain records and links before those portals work.

