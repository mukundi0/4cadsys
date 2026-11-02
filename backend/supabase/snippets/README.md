# Local demo accounts

Start the local Supabase stack and apply the migrations before seeding:

```powershell
npx.cmd --yes supabase --workdir backend start
```

In PowerShell, capture the local API URL and service role key without printing
them, then run the seed script:

```powershell
$status = npx.cmd --yes supabase --workdir backend status -o env
$env:SUPABASE_URL = (($status | Select-String '^API_URL=').Line -split '=', 2)[1].Trim('"')
$env:SUPABASE_SERVICE_ROLE_KEY = (($status | Select-String '^SERVICE_ROLE_KEY=').Line -split '=', 2)[1].Trim('"')
try {
  node backend/supabase/snippets/seed_demo_accounts.mjs
} finally {
  Remove-Item Env:SUPABASE_URL, Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
}
```

The script refuses non-local URLs. It creates or updates these local accounts;
the password for each is `DemoSchool!2026`:

| Role | Email |
| --- | --- |
| Student | `demo.student@example.com` |
| Parent/guardian | `demo.parent@example.com` |
| Teacher | `demo.teacher@example.com` |
| Admin | `demo.admin@example.com` |

The student and parent are linked, and the student has a sample Form 2 East
record. These accounts and password are for local development only.
