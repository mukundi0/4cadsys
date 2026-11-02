# Design handoff

**Project:** 4CAD School Management System
**Frontend:** React, TypeScript, Vite
**Backend:** Supabase

## Design source

The supplied Acadsys redesign archives are the visual reference. They are not stored in this repository.

## Implemented portals

- Student: home, assignments, reports, fees, profile, and timetable.
- Parent/guardian: linked children, assignments, reports, timetable, fee statements, and payment submission.
- Staff: admissions, enrolments, finance, attendance, reports, timetable, and student requests.
- Administrator: user and role management, account status, school profile, and initial-payment policy.
- Responsive layouts, shared sign-in, school branding, and school color theming.

## Current source locations

- `frontend/src/styles.css`, `frontend/src/tokens.css` - design tokens and layouts.
- `frontend/src/SignIn.tsx`, `frontend/src/App.tsx` - sign-in and role routing.
- `frontend/src/student/StudentPortal.tsx` - student portal.
- `frontend/src/parent/ParentPortal.tsx` - parent portal.
- `frontend/src/staff/StaffPortal.tsx` and `frontend/src/staff/` - staff workflows.
- `frontend/src/admin/AdminPortal.tsx` - administrator portal.
- `backend/supabase/functions/school-api/index.ts` - authenticated API and role checks.
- `backend/supabase/migrations/` - database schema and migrations.

## Local development

From `frontend/`, run `npm.cmd ci` then `npm.cmd run dev`. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the ignored `frontend/.env.local` file. Never place a service-role key in frontend configuration.

## Deployment and verification status

The portal changes are committed and pushed to GitHub. Supabase deployment of the pending migrations and updated `school-api` still needs to be completed. Frontend hosting and a live sign-in/role-permission review are not confirmed. Daraja and email delivery need provider credentials before those integrations can be exercised.
