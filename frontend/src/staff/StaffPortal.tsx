import { useCallback, useEffect, useState } from 'react'
import Shell from '../Shell'
import type { NavItem } from '../Shell'
import { Card, Empty, Notice, PageHead, longDate } from '../ui'
import { navigate } from '../router'
import { staffRequest } from '../staffApi'
import type { Applicant, Enrolment, Payment } from '../staffApi'
import Admissions from './Admissions'
import { Enrolments, Finance } from './Money'
import Attendance from './Attendance'
import Reports from './Reports'
import Timetable from './Timetable'

export type Dashboard = { students: number; applications: number; pendingPayments: number; outstanding: string; attendanceToday: { present: number; absent: number } }
export type StaffData = { dashboard: Dashboard | null; applicants: Applicant[]; payments: Payment[]; enrolments: Enrolment[]; term: string }
export type Act = (url: string, data: unknown) => Promise<boolean>

const abbreviate = (v: string) => { const n = Number(v || 0); return 'KSh ' + (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'K' : n.toLocaleString('en-KE')) }

export default function StaffPortal({ school, path, name, onSignOut }: { school: string; path: string; name: string; onSignOut: () => void }) {
  const [data, setData] = useState<StaffData>({ dashboard: null, applicants: [], payments: [], enrolments: [], term: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(async () => {
    try {
      const [dashboard, a, f, e] = await Promise.all([staffRequest<Dashboard>('/api/staff/dashboard/'), staffRequest<{ applicants: Applicant[] }>('/api/staff/admissions/'), staffRequest<{ payments: Payment[] }>('/api/staff/finance/'), staffRequest<{ enrolments: Enrolment[] }>('/api/staff/enrolments/')])
      setData({ dashboard, applicants: a.applicants, payments: f.payments, enrolments: e.enrolments, term: e.enrolments[0]?.term ?? a.applicants[0]?.term ?? '' })
    } catch (x) { setError(x instanceof Error ? x.message : 'Could not load school data.') }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  // Every staff action goes through here so failures show one dismissible notice.
  const act: Act = async (url, body) => { setError(''); setBusy(true); try { await staffRequest(url, 'POST', body); await refresh(); return true } catch (x) { setError(x instanceof Error ? x.message : 'Action failed.'); return false } finally { setBusy(false) } }

  const toReview = data.applicants.filter(a => !['accepted', 'declined', 'enrolled'].includes(a.statusCode)).length
  const ready = data.enrolments.filter(e => e.complete && !e.studentCreated).length
  const pending = data.payments.filter(p => p.status === 'pending').length
  const nav: NavItem[] = [{ path: '/staff', label: 'Overview' }, { path: '/staff/admissions', label: 'Admissions', count: toReview }, { path: '/staff/enrolments', label: 'Enrolments', count: ready }, { path: '/staff/finance', label: 'Finance', count: pending }, { path: '/staff/attendance', label: 'Attendance' }, { path: '/staff/reports', label: 'Reports' }, { path: '/staff/timetable', label: 'Timetable' }]
  const tabs = [nav[0], nav[1], nav[3], nav[4]]
  const page = nav.find(n => n.path === path)?.path ?? '/staff'
  return <Shell portal="staff" portalName="School office" school={school} user={{ name, role: 'School staff' }} nav={nav} tabs={tabs} path={page} term={data.term} onSignOut={onSignOut}>
    {error && <Notice onDismiss={() => setError('')}>{error}</Notice>}
    {page === '/staff' && <Overview name={name} data={data} toReview={toReview} ready={ready} pending={pending} />}
    {page === '/staff/admissions' && <Admissions data={data} act={act} busy={busy} />}
    {page === '/staff/enrolments' && <Enrolments data={data} act={act} busy={busy} />}
    {page === '/staff/finance' && <Finance data={data} act={act} busy={busy} />}
    {page === '/staff/attendance' && <Attendance term={data.term} onError={setError} />}
    {page === '/staff/reports' && <Reports term={data.term} onError={setError} />}
    {page === '/staff/timetable' && <Timetable term={data.term} onError={setError} />}
  </Shell>
}

function Overview({ name, data, toReview, ready, pending }: { name: string; data: StaffData; toReview: number; ready: number; pending: number }) {
  const d = data.dashboard, a = d?.attendanceToday, total = a ? a.present + a.absent : 0
  const hour = new Date().getHours(), hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const todo = [
    { n: toReview, title: 'Applications to review', meta: 'Admissions', to: '/staff/admissions', c: 'var(--amber)' },
    { n: ready, title: 'Ready for an admission number', meta: 'Enrolments', to: '/staff/enrolments', c: 'var(--ok)' },
    { n: pending, title: 'Payments to verify', meta: 'Finance', to: '/staff/finance', c: 'var(--brand)' },
  ].filter(x => x.n > 0)
  return <>
    <PageHead greet eyebrow={longDate()} title={`${hello}, ${name.split(' ')[0]}`} action={<button className="btn" onClick={() => navigate('/staff/admissions')}>New application</button>} />
    <div className="grid g-stat">
      <Card label="Students enrolled"><div className="stat"><span className="v">{d?.students ?? '—'}</span></div></Card>
      <Card label="Applications to review"><div className="stat"><span className="v">{d?.applications ?? '—'}</span></div></Card>
      <Card label="Payments to verify"><div className="stat"><span className="v">{d?.pendingPayments ?? '—'}</span></div></Card>
      <Card label="Outstanding invoices"><div className="stat"><span className="v mono">{d ? abbreviate(d.outstanding) : '—'}</span></div></Card>
    </div>
    <div className="grid g-1-4">
      <Card title="Needs your attention">{todo.length ? todo.map(t => <div className="row between" key={t.to}><div className="row"><i style={{ width: 8, height: 8, background: t.c, borderRadius: 2 }} /><div><b>{t.n} {t.title.toLowerCase()}</b><p className="muted">{t.meta}</p></div></div><button className="link" onClick={() => navigate(t.to)}>Open</button></div>) : <Empty title="You’re all caught up" body="Nothing needs your attention right now." />}</Card>
      <Card title="Attendance today">{total ? <><div className="stat"><span className="v" style={{ fontSize: 34 }}>{a!.present}</span></div><p className="muted">present of {total} · {a!.absent} absent</p><div className="bar"><i style={{ width: a!.present / total * 100 + '%', background: 'var(--ok)' }} /><i className="bad" style={{ width: a!.absent / total * 100 + '%' }} /></div></> : <Empty title="No register yet" body="Attendance recorded today will appear here." />}</Card>
    </div>
  </>
}
