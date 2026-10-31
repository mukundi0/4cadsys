import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import SignIn from './SignIn'
import { detectRole, loadSchoolName, signOutAll } from './auth'
import type { Who } from './auth'
import { applySchoolTheme } from './theme'
import { Logo } from './ui'
import { migrateLegacyHash, navigate, usePath } from './router'

const StudentPortal = lazy(() => import('./student/StudentPortal'))
const ParentPortal = lazy(() => import('./parent/ParentPortal'))
const StaffPortal = lazy(() => import('./staff/StaffPortal'))
const AdminPortal = lazy(() => import('./admin/AdminPortal'))
migrateLegacyHash()

const home = { student: '/', parent: '/parent', staff: '/staff', admin: '/admin' } as const
// A signed-in user only sees their own portal; any other path lands on its home.
function belongs(path: string, role: Who['role']) {
  const inside = (base: string) => path === base || path.startsWith(base + '/')
  if (role === 'student') return !inside('/parent') && !inside('/staff') && !inside('/admin')
  if (role === 'admin') return inside('/admin')
  return inside(home[role])
}

export default function App() {
  const path = usePath()
  const [who, setWho] = useState<Who | null | undefined>(undefined)
  const [school, setSchool] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try { const w = await detectRole(); setWho(w); setError(''); if (w) setSchool(await loadSchoolName()) } catch (e) { setWho(null); setError(e instanceof Error ? e.message : 'Could not load your portal.') }
  }, [])
  useEffect(() => { applySchoolTheme(null); void load() }, [load])
  useEffect(() => { if (who && !belongs(path, who.role)) navigate(home[who.role], true) }, [who, path])
  const signOut = async () => { await signOutAll(); setWho(null); navigate('/', true) }

  if (who === undefined) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }} role="status" aria-label="Loading"><Logo size={22} animated /></div>
  if (!who) return <>{error && <p className="notice bad" role="alert">{error}</p>}<SignIn onSignedIn={() => void load()} /></>
  const props = { school: school || 'Your school', path, onSignOut: () => void signOut() }
  return <Suspense fallback={<p className="muted" style={{ padding: 32 }} role="status">Loadingâ€¦</p>}>
    {who.role === 'student' ? <StudentPortal {...props} /> : who.role === 'parent' ? <ParentPortal {...props} /> : who.role === 'admin' ? <AdminPortal {...props} name={who.name} /> : <StaffPortal {...props} name={who.name} />}
  </Suspense>
}

