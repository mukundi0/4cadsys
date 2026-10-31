# 4cadsys

A school management portal built with React, TypeScript, Supabase Auth, Postgres, Storage, and Edge Functions.

## Supabase setup

1. Create a Supabase project and copy its Project URL and publishable (or legacy anon) key.
2. In the project root, copy `.env.example` to `frontend/.env.local`, then set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Install and run the frontend:

   ```powershell
   cd frontend
   npm.cmd ci
   npm.cmd run dev
   ```

4. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link this folder to the project. Apply the database migration and deploy the API function:

   ```powershell
   supabase login
   supabase --workdir backend link --project-ref YOUR_PROJECT_REF
   supabase --workdir backend db push
   supabase --workdir backend functions deploy school-api --no-verify-jwt
   supabase --workdir backend functions deploy daraja-callback --no-verify-jwt
   ```

   Supabase injects its server-side API secrets into Edge Functions. Never put a secret key in a `VITE_` variable or browser code. Configure optional Daraja/email secrets with `supabase --workdir backend secrets set MPESA_CONSUMER_KEY=... MPESA_CONSUMER_SECRET=... MPESA_SHORTCODE=... MPESA_PASSKEY=... DARAJA_CALLBACK_SECRET=... MPESA_CALLBACK_URL=... RESEND_API_KEY=...`.

5. Create school users in Supabase Auth. The migration trigger creates a `profiles` row for each account; update its role in the Supabase Dashboard's Table Editor. Add each student's `students` row or each guardian's `guardians` row and guardian links. Staff roles must be assigned only by a trusted project owner.

6. The linked demo project currently has a `Demo School` profile with `demo@example.com` as the contact email, plus one auto-confirmed demo admin account. Replace the demo school details and change the admin password before real use. Configure `teacher_assignments`, `timetable_configurations`, `timetable_requirements`, `teacher_availability`, `attendance_alert_policies`, and `initial_payment_policies` as needed for the term. Staff screens can then manage admissions, invoices, payments, attendance, reports, and generated lessons through the API.

The migration is in `backend/supabase/migrations/`. It creates the school domain tables, enables row level security, limits direct browser access, and creates the private `school-private` Storage bucket. User-facing domain requests go through `backend/supabase/functions/school-api`, which verifies the caller's Supabase access token and checks the profile role before using its server-only database key. Related actions such as assignment submission, invoice creation and editing, payment review, admission decisions, report-session creation, timetable generation, and report publication use database transactions. M-Pesa callbacks are handled by a separate function because Safaricom calls them without a Supabase user session; callback processing is idempotent and locked by checkout ID, and it requires a random callback secret in the URL.

## Previewing the frontend without Supabase

`npm run dev` also serves sample data for every portal, in development only: open `/?demo=student`, `/?demo=parent` or `/?demo=staff`. The sample data lives in `frontend/src/demo.ts` and is not included in production builds.

## Supabase backend

The student portal, staff dashboard, admissions and document review, finance verification and invoice creation, enrolment gates, attendance registers and alerts, reports, timetable editing/generation, private document/payment proofs, and M-Pesa STK/callback paths have Supabase Edge Function handlers. Supabase is the only application backend.

The Supabase migration and both Edge Functions are deployed to the configured project. The hosted database has 31 public tables with RLS enabled on every table, the `school-private` bucket is private, and all nine business RPCs are restricted to the server role. The deployed functions are active; unauthenticated access is rejected, and a demo admin sign-in was verified against the live API. Create student, guardian, and staff Supabase Auth accounts and matching profile/domain rows as needed. Parent-facing UI is not built yet. M-Pesa requires Daraja credentials and callback configuration; email delivery requires a Resend key.

## Local configuration and data

Keep the actual project URL and public key in `frontend/.env.local`; that file is ignored by Git. Supabase Auth is configured for email and password, so sign-in uses the account email address. Create Supabase Auth users and matching profile/domain rows in the project before signing in.

For local Supabase development, follow the Supabase CLI local development guide, then run `supabase --workdir backend start` and `supabase --workdir backend db reset`. Copy `backend/supabase/functions/.env.example` to `backend/supabase/functions/.env` and fill in any local Daraja/email credentials needed. That `.env` file is ignored by Git.
