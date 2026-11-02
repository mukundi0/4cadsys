# 4CAD School Management System — Design Handoff

**Date:** 31 October 2026  
**Project:** School Management System  
**Frontend:** React, TypeScript, Vite  
**Backend:** Supabase

## Design source

Use only the two supplied design archives as the visual source of truth:

- `4CAD System Full Redesign.zip`
- `4CAD System Full Redesign (1).zip`

The archives contain the Acadsys HTML prototypes, brand guidance, mobile layouts, README, support script, and CSS tokens. They were supplied from the developer's Downloads folder and are not included in the repository.

## Implemented

- Acadsys design tokens, typography, geometric logo mark, favicon, school crest, and school color theming.
- One sign-in flow for students, school staff, and parents/guardians.
- Student portal: home, assignments, reports, fees, profile, and timetable.
- Parent portal: home, child selection, fee statement, and payment submission.
- Staff portal: dashboard, admissions, enrolments, finance, attendance, reports, and timetable.
- Responsive desktop and mobile layouts, including role-specific mobile navigation.
- School branding endpoint and local schema migrations for guardian home area and school theme.

## Key implementation locations

- `frontend/src/acadsys.css` — design system and responsive layouts.
- `frontend/src/tokens.css` — shared design tokens.
- `frontend/src/StudentLogin.tsx` — shared sign-in.
- `frontend/src/StudentHome.tsx` — student portal.
- `frontend/src/ParentApp.tsx` — parent portal.
- `frontend/src/AdminApp.tsx` — staff portal shell and dashboard.
- `frontend/src/StaffAttendance.tsx`, `StaffReports.tsx`, `StaffTimetable.tsx` — staff workflows.
- `frontend/src/schoolTheme.ts`, `SchoolCrest.tsx`, `AcadsysMark.tsx` — school branding and Acadsys identity.
- `backend/supabase/functions/school-api/index.ts` — API and school branding endpoint.
- `backend/supabase/migrations/202610300001_guardian_home_area.sql`
- `backend/supabase/migrations/202610300002_school_theme.sql`

## Run locally

From the repository root in PowerShell:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open the local URL printed by Vite. To build the frontend for production:

```powershell
npm.cmd run build
```

The production build completed successfully on 30 October 2026.

The ignored `frontend/.env.local` must contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep service-role keys and other secrets out of frontend configuration.

## Remaining handoff actions

1. Apply the two new migrations to the linked Supabase project.
2. Deploy the updated `school-api` Edge Function so pre-login school branding is available in the hosted app.
3. Review the result in a browser at desktop and mobile sizes. A screenshot-by-screenshot comparison against every prototype has not yet been completed.
4. Before real school use, replace demo school details and rotate the demo admin password. Configure Daraja and email secrets if those features are enabled.

The UI and migrations described here are local repository changes. They have not been committed or deployed as part of this handoff.
