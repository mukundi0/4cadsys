import { useEffect, useMemo, useState } from 'react'
import { staffRequest } from '../staffApi'
import { Card, Empty, Notice, PageHead, Pill, Segmented } from '../ui'

type Row = { studentId: string; name: string; admissionNumber: string; class: string; stream: string; status: string | null; verified: boolean; note: string }
type Mark = { status: 'present' | 'absent'; verified: boolean }
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Nairobi' }).format(new Date())

export default function Attendance({ term: initialTerm, onError }: { term: string; onError: (m: string) => void }) {
  const date = today()
  const [term, setTerm] = useState(initialTerm)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [stream, setStream] = useState('')
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [saved, setSaved] = useState('')
  const [alerts, setAlerts] = useState('')
  useEffect(() => { setTerm(t => t || initialTerm) }, [initialTerm])
  useEffect(() => {
    staffRequest<{ students: Row[] }>(`/api/staff/attendance/?date=${date}`).then(r => {
      setRows(r.students); setStream(s => s || (r.students[0] ? r.students[0].class + '|' + r.students[0].stream : ''))
      setMarks(Object.fromEntries(r.students.filter(s => s.status).map(s => [s.studentId, { status: s.status === 'absent' ? 'absent' : 'present', verified: s.verified } as Mark])))
    }).catch(e => onError(e instanceof Error ? e.message : 'Could not load the register.'))
  }, [date, onError])
  const streams = useMemo(() => [...new Set((rows ?? []).map(r => r.class + '|' + r.stream))], [rows])
  const done = (key: string) => (rows ?? []).filter(r => r.class + '|' + r.stream === key).every(r => r.status)
  const list = (rows ?? []).filter(r => r.class + '|' + r.stream === stream)
  const markOf = (id: string): Mark => marks[id] ?? { status: 'present', verified: false }
  const absent = list.filter(r => markOf(r.studentId).status === 'absent').length
  async function submit() {
    try {
      await staffRequest('/api/staff/attendance/save/', 'POST', { term, date, records: list.map(r => ({ studentId: r.studentId, status: markOf(r.studentId).status, verified: markOf(r.studentId).verified })) })
      setRows(rs => (rs ?? []).map(r => list.some(l => l.studentId === r.studentId) ? { ...r, status: markOf(r.studentId).status } : r))
      setSaved(new Date().toTimeString().slice(0, 5))
    } catch (e) { onError(e instanceof Error ? e.message : 'Could not submit the register.') }
  }
  async function evaluate() {
    try { const r = await staffRequest<{ created: number }>('/api/staff/attendance/evaluate-alerts/', 'POST', { term }); setAlerts(r.created ? `${r.created} guardian alert${r.created > 1 ? 's' : ''} sent.` : 'No new alerts. No student has reached the threshold.') } catch (e) { onError(e instanceof Error ? e.message : 'Could not evaluate alerts.') }
  }
  const [cls, st] = stream.split('|')
  return <>
    <PageHead eyebrow={date} title="Attendance" sub="Take the morning register, then verify absences." />
    <div className="row wrap">{streams.map(s => <button key={s} className="btn secondary sm" aria-pressed={s === stream} style={s === stream ? { background: 'var(--brand-tint)', borderColor: 'var(--brand-border)' } : undefined} onClick={() => { setStream(s); setSaved('') }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: done(s) ? 'var(--ok)' : 'var(--amber)' }} />{s.replace('|', ' ')}</button>)}</div>
    {rows && !rows.length && <Card><Empty title="No students yet" body="Enrol students to take a register." /></Card>}
    {list.length > 0 && <Card title={`${cls} ${st}`.trim()} action={saved ? <Pill tone="ok">Submitted {saved}</Pill> : <button className="btn sm" disabled={!term} onClick={() => void submit()}>Submit register</button>}>
      <p className="muted">{list.length - absent} present · {absent} absent{!term && ' · enter the term to submit'}</p>
      {!initialTerm && <label className="field" style={{ maxWidth: 240 }}>Term<input value={term} onChange={e => setTerm(e.target.value)} placeholder="Term 3, 2026" /></label>}
      <div>{list.map(r => { const m = markOf(r.studentId); return <div key={r.studentId} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule-soft)' }}>
        <div><b style={{ fontWeight: 500 }}>{r.name}</b><p className="mono muted" style={{ fontSize: 12 }}>ADM {r.admissionNumber}</p></div>
        <div className="row"><Segmented value={m.status} onChange={v => setMarks(x => ({ ...x, [r.studentId]: { status: v, verified: false } }))} options={[{ id: 'present', label: 'Present', cls: 'p' }, { id: 'absent', label: 'Absent', cls: 'a' }]} />
          {m.status === 'absent' && <button className={'btn sm ' + (m.verified ? 'secondary' : '')} onClick={() => setMarks(x => ({ ...x, [r.studentId]: { ...m, verified: !m.verified } }))}>{m.verified ? <span className="ok-text">✓ Verified</span> : 'Verify absence'}</button>}</div></div> })}</div>
    </Card>}
    <Card title="Attendance alerts"><p className="muted">A guardian is notified when verified absences reach 33% of school days, after at least 10 school days from the student’s first day. No duplicate alerts are sent.</p>{alerts && <Notice tone="info">{alerts}</Notice>}<div><button className="btn secondary" disabled={!term} onClick={() => void evaluate()}>Check for alerts</button></div></Card>
  </>
}
