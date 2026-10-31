import { api, signIn, signOut } from './supabase'

export type Role = 'student' | 'parent' | 'staff'
export type Who = { role: Role; name: string }
export type SignInKind = 'student' | 'staff' | 'parent'

const lastSchool = 'acadsys-school-name'
export const cachedSchoolName = () => { try { return localStorage.getItem(lastSchool) || '' } catch { return '' } }

export async function loadSchoolName(): Promise<string> {
  try {
    const { school } = await api<{ school: { name: string } | null }>('/api/school/profile/')
    if (school?.name) { try { localStorage.setItem(lastSchool, school.name) } catch { /* private mode */ } return school.name }
  } catch { /* the name is cosmetic */ }
  return cachedSchoolName()
}

// One sign-in; the portal is then chosen from what the API accepts for this account.
export async function detectRole(): Promise<Who | null> {
  const unauthorised = (e: unknown) => (e as { status?: number }).status === 401 || (e instanceof Error && e.message.startsWith('Sign in'))
  try { const s = await api<{ user: { name: string } }>('/api/staff/session/'); return { role: 'staff', name: s.user.name } } catch (e) { if (unauthorised(e)) return null }
  try { await api('/api/parent/children/'); return { role: 'parent', name: '' } } catch (e) { if (unauthorised(e)) return null }
  try { const p = await api<{ student: { name: string } }>('/api/student/portal/'); return { role: 'student', name: p.student.name } } catch (e) { if (unauthorised(e)) return null; throw e }
}
export const signInWith = (email: string, password: string) => signIn(email, password)
export const signOutAll = () => signOut()
