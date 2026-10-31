import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Shell from '../Shell'
import type { NavItem } from '../Shell'
import { Card, Empty, Notice, PageHead, Pill, Progress, longDate, money, statusTone } from '../ui'
import { navigate } from '../router'
import { loadStudentPortal, submitStudentAssignment } from '../studentApi'
import type { Assignment, StudentPortal as Portal } from '../studentApi'

const nav: NavItem[] = [{ path: '/', label: 'Home' }, { path: '/learning', label: 'Learning' }, { path: '/timetable', label: 'Timetable' }, { path: '/reports', label: 'Reports' }, { path: '/attendance', label: 'Attendance' }, { path: '/fees', label: 'Fees' }, { path: '/profile', label: 'My profile' }]
const tabs: NavItem[] = [{ path: '/', label: 'Today' }, { path: '/learning', label: 'Learning' }, { path: '/reports', label: 'Reports' }, { path: '/profile', label: 'More' }]
const monday = (d: Date) => (d.getDay() + 6) % 7
const dueShort = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : 'No due date'

export default function StudentPortal({ school, path, onSignOut }: { school: string; path: string; onSignOut: () => void }) {
  const [portal, setPortal] = useState<Portal | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => { let live = true; loadStudentPortal().then(p => { if (live) { setPortal(p); setError('') } }).catch(e => { if (live) setError(e instanceof Error ? e.message : 'Could not load your portal.') }); return () => { live = false } }, [refresh])
  if (!portal) return <div className="content">{error ? <Notice>{error}</Notice> : <p className="muted" role="status">Loading your portal…</p>}</div>
  const s = portal.student, page = nav.find(n => n.path === path) ? path : '/'
  const open = (a: Assignment) => { setSelected(a.id); navigate('/learning') }
  return <Shell portal="student" portalName="Student portal" school={school} user={{ name: s.name, role: `${s.level} · ${s.stream}` }} nav={nav} tabs={tabs} path={page} term={s.term} switchTo={{ label: 'Staff portal →', path: '/staff' }} onSignOut={onSignOut}>
    {error && <Notice onDismiss={() => setError('')}>{error}</Notice>}
    {page === '/' && <Home portal={portal} onOpen={open} />}
    {page === '/learning' && <Learning portal={portal} selectedId={selected} onSelect={setSelected} onSubmitted={() => { setSelected(null); setRefresh(x => x + 1) }} onError={setError} />}
    {page === '/timetable' && <Timetable portal={portal} />}
    {page === '/reports' && <Reports portal={portal} />}
    {page === '/attendance' && <Attendance portal={portal} />}
    {page === '/fees' && <Fees portal={portal} />}
    {page === '/profile' && <Profile portal={portal} />}
  </Shell>
}

function Home({ portal, onOpen }: { portal: Portal; onOpen: (a: Assignment) => void }) {
  const s = portal.student, now = new Date()
  const today = portal.lessons.filter(l => l.weekday === monday(now)).sort((a, b) => a.time.localeCompare(b.time))
  const hhmm = now.toTimeString().slice(0, 5)
  const nowIndex = today.findIndex(l => l.time.slice(0, 5) >= hhmm)
  const next = [...portal.assignments].filter(a => !a.submission).sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))[0]
  const a = portal.attendance.summary, pct = a.daysRecorded ? Math.round(a.present / a.daysRecorded * 100) : 0
  const notice = portal.announcements[0], report = portal.reports[0]
  return <>
    <PageHead greet eyebrow={longDate(now)} title={`Welcome back, ${s.firstName}`} sub={`${s.level} · Stream ${s.stream} · ${s.curriculum}`} />
    <div className="grid g-1-5">
      <Card title="Today’s lessons" action={<button className="link" onClick={() => navigate('/timetable')}>Weekly timetable</button>}>
        {today.length ? <div className="stack" style={{ gap: 8 }}>{today.map((l, i) => <div key={l.id} className={'lesson' + (i === nowIndex ? ' now' : '')}><span className="t">{l.time}</span><div><b>{l.subject}</b><span>{[l.teacher, l.room].filter(Boolean).join(' · ')}</span></div></div>)}</div> : <Empty title="No lessons today" body="Your timetable for today will appear here." />}
      </Card>
      <section className="card highlight">
        <div className="card-head"><span className="card-label">Next assignment</span>{next?.due && <span className="pill due">Due {dueShort(next.due)}</span>}</div>
        {next ? <><p className="sub">{next.subject} · {next.teacher}</p><p style={{ font: '600 26px/1.15 var(--font-sans)', letterSpacing: '-.02em' }}>{next.title}</p><p className="sub">{next.method === 'online' ? 'Submit online' : 'Hand in during class'}</p><div><button className="btn btn-light" onClick={() => onOpen(next)}>Open assignment →</button></div></> : <><b>Nothing due right now</b><p className="sub">New work from your teachers will appear here.</p></>}
      </section>
    </div>
    <div className="grid g-3">
      <button className="card clickable" onClick={() => navigate('/attendance')}><span className="card-label">Attendance</span><div className="stat"><span className="v">{a.daysRecorded ? pct + '%' : '—'}</span></div><Progress value={pct} tone="ok" /><span className="muted">{a.present} of {a.daysRecorded} days present</span></button>
      <Card label="Latest notice">{notice ? <><span className="mono muted">{new Date(notice.publishedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span><h3>{notice.title}</h3><p className="muted">{notice.body}</p></> : <Empty title="No notices" body="Messages from the school will appear here." />}</Card>
      <button className="card clickable" onClick={() => navigate('/reports')}><span className="card-label">Latest report</span>{report ? <><h3>{report.title}</h3><div><Pill tone={statusTone(report.status)}>{report.status}</Pill></div></> : <Empty title="No reports yet" body="Approved reports will appear here." />}</button>
    </div>
  </>
}

function Learning({ portal, selectedId, onSelect, onSubmitted, onError }: { portal: Portal; selectedId: string | null; onSelect: (id: string) => void; onSubmitted: () => void; onError: (m: string) => void }) {
  const sel = portal.assignments.find(a => a.id === selectedId) ?? null
  const [answer, setAnswer] = useState(''), [busy, setBusy] = useState(false)
  const state = (a: Assignment) => a.submission ? ['Submitted', 'ok'] as const : a.method === 'class' ? ['In class', 'neutral'] as const : ['To do', 'warn'] as const
  async function submit(e: FormEvent) { e.preventDefault(); if (!sel) return; setBusy(true); try { await submitStudentAssignment(sel.id, answer); setAnswer(''); onSubmitted() } catch (x) { onError(x instanceof Error ? x.message : 'Submission failed.') } finally { setBusy(false) } }
  return <>
    <PageHead eyebrow="Your student space" title="Learning" />
    <div className="split">
      <Card title="Your assignments">
        {portal.assignments.length ? <div className="stack" style={{ gap: 4 }}>{portal.assignments.map(a => { const [label, tone] = state(a); return <button key={a.id} className="list-row" aria-pressed={a.id === sel?.id} onClick={() => onSelect(a.id)}><span className="row between"><span className="subject-tag">{a.subject}</span><Pill tone={tone}>{label}</Pill></span><b>{a.title}</b><span className="muted">Due {dueShort(a.due)} · {a.teacher}</span></button> })}</div> : <Empty title="No assignments yet" body="No assignments have been published for your class." />}
      </Card>
      {sel ? <Card>
        <p className="muted">{sel.subject} · {sel.teacher}</p><h2 style={{ fontSize: 26, letterSpacing: '-.02em' }}>{sel.title}</h2>
        <div className="facts"><div><dt>Due</dt><dd>{sel.due ? new Date(sel.due).toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' }) : 'No due date'}</dd></div><div><dt>Method</dt><dd>{sel.method === 'online' ? 'Submit online' : 'Hand in during class'}</dd></div></div>
        <div><h3>Instructions</h3><p>{sel.instructions || 'No additional instructions.'}</p></div>
        {sel.method === 'class' ? <p className="info-box">Hand this work to your teacher in class.</p>
          : sel.submission ? <div className="info-box ok stack" style={{ gap: 6 }}><b>Submitted</b><p>{sel.submission.answer}</p>{sel.submission.score && <p>Score: <span className="mono">{sel.submission.score}</span></p>}{sel.submission.feedback && <p>Teacher: {sel.submission.feedback}</p>}</div>
          : <form className="stack" onSubmit={submit}><label className="field">Your answer<textarea rows={7} value={answer} onChange={e => setAnswer(e.target.value)} required /></label><div><button className="btn" disabled={busy}>{busy ? 'Submitting…' : 'Submit assignment'}</button></div></form>}
      </Card> : <Card><Empty title="Choose an assignment" body="Select one from the list to see its instructions." /></Card>}
    </div>
  </>
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
function Timetable({ portal }: { portal: Portal }) {
  const times = [...new Set(portal.lessons.map(l => l.time))].sort(), today = monday(new Date())
  const cell = (d: number, t: string) => portal.lessons.find(l => l.weekday === d && l.time === t)
  return <>
    <PageHead eyebrow="Your student space" title="Timetable" />
    <Card title="Weekly timetable" className="flush">
      {times.length ? <div className="table-wrap"><table className="tt"><thead><tr><th style={{ width: 80 }}>Time</th>{days.map((d, i) => <th key={d} className={i === today ? 'today' : ''}>{d}</th>)}</tr></thead>
        <tbody>{times.flatMap((t, ti) => [
          ...(ti === 3 ? [<tr key="break" className="brk"><td colSpan={6}>BREAK</td></tr>] : []),
          <tr key={t}><td className="mono">{t}</td>{days.map((_, d) => { const l = cell(d, t); return <td key={d} className={d === today ? 'today' : ''}>{l && <div className="cell"><b>{l.subject}</b><span>{[l.teacher, l.room].filter(Boolean).join(' · ')}</span></div>}</td> })}</tr>,
        ])}</tbody></table></div>
        : <div style={{ padding: 20 }}><Empty title="No timetable yet" body="Your school has not published a timetable for this class yet." /></div>}
    </Card>
  </>
}

export function ReportCard({ report }: { report: Portal['reports'][number] }) {
  return <Card className="flush">
    <div className="stack" style={{ padding: 20, gap: 6 }}><div className="row between wrap"><h2 style={{ fontSize: 24, letterSpacing: '-.02em' }}>{report.title}</h2><Pill tone={statusTone(report.status)}>{report.status}</Pill></div><p className="muted">{report.period} · {report.term}</p></div>
    <div className="table-wrap"><table><thead><tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Teacher comment</th></tr></thead><tbody>{report.subjects.map(x => <tr key={x.subject}><th scope="row">{x.subject}</th><td className="mono">{x.mark === null ? <span className="warn-text">Not entered</span> : `${x.mark} / ${x.maximumMark}`}</td><td>{x.grade || '—'}</td><td>{x.teacherComment || '—'}</td></tr>)}</tbody></table></div>
    <div className="grid g-eq" style={{ padding: 20 }}><div className="tinted"><b>Class teacher</b><p>{report.classTeacherComment || 'No comment.'}</p></div>{report.principalComment && <div className="tinted"><b>Principal</b><p>{report.principalComment}</p></div>}</div>
  </Card>
}
function Reports({ portal }: { portal: Portal }) {
  return <><PageHead eyebrow="Your student space" title="Reports" />{portal.reports.length ? portal.reports.map(r => <ReportCard key={r.id} report={r} />) : <Card title="Reports"><Empty title="No reports yet" body="No approved reports have been published yet." /></Card>}</>
}

export function AttendanceView({ attendance }: { attendance: Portal['attendance'] }) {
  const a = attendance.summary
  return <>
    <div className="grid g-3"><Card label="Days recorded"><div className="stat"><span className="v">{a.daysRecorded}</span></div></Card><Card label="Present"><div className="stat"><span className="v">{a.present}</span></div></Card><Card label="Verified absence"><div className="stat"><span className="v">{a.verifiedAbsence}</span></div></Card></div>
    <Card title="Attendance record" className="flush">{attendance.records.length ? <div className="table-wrap"><table style={{ ['--tw' as string]: '560px' }}><thead><tr><th>Date</th><th>Status</th><th>Verification</th><th>Note</th></tr></thead><tbody>{attendance.records.map(r => <tr key={r.date}><td className="mono">{r.date}</td><td><Pill tone={statusTone(r.status)}>{r.status}</Pill></td><td>{r.verified ? 'Verified' : 'Not verified'}</td><td>{r.note || '—'}</td></tr>)}</tbody></table></div> : <div style={{ padding: 20 }}><Empty title="No attendance yet" body="No attendance has been recorded for this term." /></div>}</Card>
  </>
}
function Attendance({ portal }: { portal: Portal }) { return <><PageHead eyebrow="Your student space" title="Attendance" /><AttendanceView attendance={portal.attendance} /></> }

export function StatementTable({ statement }: { statement: Portal['fees']['statement'] }) {
  return statement.length ? <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th className="right">Charge</th><th className="right">Payment</th><th>Status</th></tr></thead><tbody>{statement.map((x, i) => <tr key={i}><td className="mono">{x.date || '—'}</td><th scope="row"><div className="cell"><b>{x.description}</b>{x.receipt && <span className="mono">{x.receipt}</span>}</div></th><td className="num">{x.charge === '0' ? '—' : money(x.charge)}</td><td className="num">{x.payment === '0' ? '—' : money(x.payment)}</td><td>{x.status ? <Pill tone={statusTone(x.status)}>{x.status}</Pill> : '—'}</td></tr>)}</tbody></table></div> : <div style={{ padding: 20 }}><Empty title="No invoices or payments" body="Nothing has been recorded for this term." /></div>
}
function Fees({ portal }: { portal: Portal }) {
  const f = portal.fees.summary
  return <>
    <PageHead eyebrow="Your student space" title="Fees" />
    <div className="grid g-stat"><Card label="Total charges"><div className="stat"><span className="v mono">{money(f.totalCharges)}</span></div></Card><Card label="Verified payments"><div className="stat"><span className="v mono">{money(f.verifiedPayments)}</span></div></Card>
      <section className="card highlight"><span className="card-label">Balance</span><div className="stat"><span className="v mono">{money(f.balance)}</span></div></section></div>
    <Card title="Your statement" className="flush"><p className="muted" style={{ padding: '0 20px 12px' }}>Payments count once the accounts office verifies them.</p><StatementTable statement={portal.fees.statement} /></Card>
  </>
}

function Profile({ portal }: { portal: Portal }) {
  const s = portal.student
  return <><PageHead eyebrow="Your student space" title="My profile" /><Card>
    <div className="row"><span className="avatar lg">{s.firstName.slice(0, 1)}</span><div><h2 style={{ fontSize: 22 }}>{s.name}</h2><p className="mono muted">ADM {s.admission}</p></div></div>
    <dl className="facts g-eq"><div><dt>Curriculum</dt><dd>{s.curriculum || '—'}</dd></div><div><dt>Class</dt><dd>{s.level}</dd></div><div><dt>Stream</dt><dd>{s.stream || '—'}</dd></div><div><dt>Current term</dt><dd>{s.term || '—'}</dd></div></dl>
    <p className="muted">To correct your details, ask the school office.</p>
  </Card></>
}
