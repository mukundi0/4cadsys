import { useCallback, useEffect, useMemo, useState } from 'react'
import { staffRequest } from '../staffApi'
import { Card, Empty, Notice, PageHead, Pill } from '../ui'

type Lesson = { id: string; class: string; stream: string; weekday: number; start: string; end: string; subject: string; teacher: string; room: string }
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const overlap = (a: Lesson, b: Lesson) => a.weekday === b.weekday && a.start < b.end && b.start < a.end

export default function Timetable({ term: initialTerm, onError }: { term: string; onError: (m: string) => void }) {
  const [term, setTerm] = useState(initialTerm)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [approved, setApproved] = useState(false)
  const [stream, setStream] = useState('')
  const [why, setWhy] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { setTerm(t => t || initialTerm) }, [initialTerm])
  const load = useCallback(async () => { if (!term) return; try { const r = await staffRequest<{ lessons: Lesson[]; approved: boolean }>(`/api/staff/timetable/?term=${encodeURIComponent(term)}`); setLessons(r.lessons); setApproved(r.approved); setStream(s => s || (r.lessons[0] ? r.lessons[0].class + '|' + r.lessons[0].stream : '')) } catch (e) { onError(e instanceof Error ? e.message : 'Could not load the timetable.') } }, [term, onError])
  useEffect(() => { void load() }, [load])
  const streams = useMemo(() => [...new Set(lessons.map(l => l.class + '|' + l.stream))], [lessons])
  const grid = lessons.filter(l => l.class + '|' + l.stream === stream)
  const times = [...new Set(grid.map(l => l.start))].sort()
  // Clash checks run on the lessons themselves, so what is shown is what is stored.
  const clashes = (key: 'teacher' | 'room') => lessons.filter((a, i) => a[key] && lessons.some((b, j) => j > i && a[key] === b[key] && overlap(a, b))).length
  const streamClash = lessons.filter((a, i) => lessons.some((b, j) => j > i && a.class === b.class && (!a.stream || !b.stream || a.stream === b.stream) && overlap(a, b))).length
  const checks: [string, number][] = [['No teacher clashes', clashes('teacher')], ['No stream clashes', streamClash], ['No room clashes', clashes('room')]]
  async function run(path: string, body: unknown, after?: () => void) { setBusy(true); try { await staffRequest(path, 'POST', body); after?.(); await load() } catch (e) { const m = e instanceof Error ? e.message : 'Request failed.'; if (path.includes('generate')) setWhy(m); else onError(m) } finally { setBusy(false) } }
  return <>
    <PageHead eyebrow={term} title="Timetable" sub={lessons.length ? approved ? 'Published · visible to students and teachers' : `Draft · ${lessons.length} lessons · review and edit before publishing` : 'No lessons generated for this term yet.'}
      action={<div className="row"><button className="btn secondary" disabled={busy || !term} onClick={() => void run('/api/staff/timetable/generate/', { term }, () => setWhy(''))}>{lessons.length ? 'Regenerate' : 'Generate'}</button><button className="btn" disabled={busy || !lessons.length || approved} onClick={() => void run('/api/staff/timetable/save/', { action: 'approve', term })}>Approve and publish</button></div>} />
    {!initialTerm && <label className="field" style={{ maxWidth: 240 }}>Term<input value={term} onChange={e => setTerm(e.target.value)} placeholder="Term 3, 2026" /></label>}
    <div className="grid g-2-1" style={{ alignItems: 'start' }}>
      <Card className="flush">{grid.length ? <><div className="row between" style={{ padding: '16px 20px' }}><h2>{stream.replace('|', ' ')}</h2>{streams.length > 1 && <select aria-label="Change stream" value={stream} onChange={e => setStream(e.target.value)}>{streams.map(s => <option key={s} value={s}>{s.replace('|', ' ')}</option>)}</select>}</div>
        <div className="table-wrap"><table className="tt"><thead><tr><th style={{ width: 70 }}>Time</th>{days.map(d => <th key={d}>{d}</th>)}</tr></thead><tbody>{times.map(t => <tr key={t}><td className="mono">{t}</td>{days.map((_, d) => { const l = grid.find(x => x.weekday === d && x.start === t); return <td key={d}>{l && <div className="cell"><b>{l.subject}</b><span>{[l.teacher, l.room].filter(Boolean).join(' · ')}</span></div>}</td> })}</tr>)}</tbody></table></div></>
        : <div style={{ padding: 20 }}><Empty title="No lessons" body="Generate a draft from the term’s teaching requirements." /></div>}</Card>
      <div className="stack">
        {lessons.length > 0 && <Card title="Constraint checks">{checks.map(([label, n]) => <div className="row" key={label}><Pill tone={n ? 'bad' : 'ok'}>{n ? '!' : '✓'}</Pill><span>{n ? `${n} clash${n > 1 ? 'es' : ''} found` : label}</span></div>)}</Card>}
        {why && <Notice tone="bad">Can’t build a timetable: {why}</Notice>}
        <Card title="Inputs"><p className="muted">Generation uses the term’s timetable settings, teaching requirements and teacher availability.</p></Card>
      </div>
    </div>
  </>
}
