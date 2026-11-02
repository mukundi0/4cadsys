// Seed local Supabase Auth accounts and linked portal records for development.
// This intentionally refuses remote Supabase URLs: never seed demo credentials
// into a live school project.
const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '')
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!baseUrl || !serviceKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from local `supabase status` output first.')
}
const hostname = new URL(baseUrl).hostname
if (!['localhost', '127.0.0.1', '::1'].includes(hostname)) {
  throw new Error('Demo account seeding only runs against local Supabase (localhost).')
}

const password = 'DemoSchool!2026'
const accounts = [
  { email: 'demo.student@example.com', username: 'demo.student', first_name: 'Amani', last_name: 'Wanjiru', role: 'student' },
  { email: 'demo.parent@example.com', username: 'demo.parent', first_name: 'Esther', last_name: 'Wanjiru', role: 'guardian' },
  { email: 'demo.teacher@example.com', username: 'demo.teacher', first_name: 'Grace', last_name: 'Mwangi', role: 'teacher' },
  { email: 'demo.admin@example.com', username: 'demo.admin', first_name: 'Sam', last_name: 'Kariuki', role: 'admin' },
]

async function request(path, { method = 'GET', body, prefer } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${text}`)
  return text ? JSON.parse(text) : null
}

async function authUser(account, users) {
  let user = users.find(item => item.email?.toLowerCase() === account.email)
  if (user) {
    user = await request(`/auth/v1/admin/users/${user.id}`, {
      method: 'PUT', body: { password, email_confirm: true, user_metadata: account },
    })
  } else {
    user = await request('/auth/v1/admin/users', {
      method: 'POST', body: { email: account.email, password, email_confirm: true, user_metadata: account },
    })
    users.push(user)
  }
  await request('/rest/v1/profiles?on_conflict=id', {
    method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
    body: { id: user.id, role: account.role, username: account.username, first_name: account.first_name, last_name: account.last_name },
  })
  return user
}

const listed = await request('/auth/v1/admin/users?page=1&per_page=1000')
const users = listed.users || []
const created = {}
for (const account of accounts) created[account.role] = await authUser(account, users)

const student = (await request('/rest/v1/students?on_conflict=user_id', {
  method: 'POST', prefer: 'resolution=merge-duplicates,return=representation',
  body: { user_id: created.student.id, admission_number: 'DEMO-2026-001', class_level: 'Form 2', stream: 'East', curriculum: '8-4-4', current_term: 'Demo Term 2026' },
}))[0]
const guardian = (await request('/rest/v1/guardians?on_conflict=user_id', {
  method: 'POST', prefer: 'resolution=merge-duplicates,return=representation',
  body: { user_id: created.guardian.id, phone: '0700 000 001', email: 'demo.parent@example.com' },
}))[0]
await request('/rest/v1/guardian_student_links?on_conflict=guardian_id,student_id', {
  method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal',
  body: { guardian_id: guardian.id, student_id: student.id, relationship: 'Parent', can_view_finances: true, can_view_reports: true },
})

console.log('Seeded local demo accounts (all passwords: DemoSchool!2026):')
for (const account of accounts) console.log(`  ${account.role.padEnd(8)} ${account.email}`)
console.log('Student and parent accounts are linked to sample learner DEMO-2026-001 (Form 2 East).')
