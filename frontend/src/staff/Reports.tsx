import { useCallback, useEffect, useState } from 'react'
import { staffRequest } from '../staffApi'
import { Card, Empty, PageHead, Pill, Progress } from '../ui'
import type { Tone } from '../ui'

type Subject = { subject: string; mark: string | null }
type Rep = { id: string; name: string; status: string; subjects: Subject[] }
type Session = { id: string; title: string; term: string; period: string; class: string; stream: string; published: boolean; reports: Rep[] }

function sessionState(s: Session): [string, Tone] {
  if (s.published) return ['Published', 'ok']
  const st = s.reports.map(r => r.status)
  if (st.length && st.every(x => x === 'approved')) return ['Ready to publish', 'info']
  if (st.length && st.every(x => x === 'review' || x === 'approved')) return ['Ready to approve', 'info']
  if (st.some(x => x === 'review')) return ['In review', 'warn']
  return ['Collecting marks', 'neutral']
}

export default function Reports({ term, onError }: { term: string; onError: (m: string) => void }) {
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [busy, setBusy] = useState('')
  const load = useCallback(() => staffRequest<{ sessions: Session[] }>('/api/staff/reports/').then(r => setSessions(r.sessions)).catch(e => onError(e instanceof Error ? e.message : 'Could not load reports.')), [onError])
  useEffect(() => { void load() }, [load])
  async function publish(s: Session) {
    setBusy(s.id)
    try {
      for (const r of s.reports.filter(x => x.status === 'review')) await staffRequest(`/api/staff/reports/${r.id}/action/`, 'POST', { action: 'approve' })
      if (s.reports[0]) await staffRequest(`/api/staff/reports/${s.reports[0].id}/action/`, 'POST', { action: 'publish' })
      await load()
    } catch (e) { onError(e instanceof Error ? e.message : 'Could not publish.') } finally { setBusy('') }
  }
  const missing = (sessions ?? []).filter(s => !s.published).flatMap(s => s.reports.flatMap(r => r.subjects.filter(x => x.mark === null).map(x => `${s.class} ${s.stream} · ${r.name} · ${x.subject}`)))
  return <>
    <PageHead eyebrow={term} title="Reports" sub="Subject teacher → Class teacher → Principal" />
    <Card className="flush">{sessions?.length ? <div className="table-wrap"><table style={{ ['--tw' as string]: '860px' }}><thead><tr><th>Stream</th><th>Marks collected</th><th>Status</th><th>Action</th></tr></thead><tbody>{sessions.map(s => {
      const cells = s.reports.flatMap(r => r.subjects), got = cells.filter(c => c.mark !== null).length, [label, tone] = sessionState(s)
      return <tr key={s.id}><th scope="row"><div className="cell"><b>{s.class} {s.stream}</b><span>{s.title} · {s.period}</span></div></th><td style={{ minWidth: 180 }}><Progress value={cells.length ? got / cells.length * 100 : 0} /><span className="mono muted" style={{ fontSize: 12 }}>{got} / {cells.length}</span></td><td><Pill tone={tone}>{label}</Pill></td>
        <td>{s.published ? <span className="muted">Visible to parents</span> : label.startsWith('Ready') ? <button className="btn sm" disabled={busy === s.id} onClick={() => void publish(s)}>Approve and publish</button> : <span className="muted">Waiting for reviews</span>}</td></tr> })}</tbody></table></div>
      : <div style={{ padding: 20 }}><Empty title="No report sessions yet" body="Create a report session for a class to start collecting marks." /></div>}</Card>
    <div className="grid g-eq">
      <Card title="Missing marks">{missing.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{missing.slice(0, 6).map(m => <li key={m}>{m}</li>)}</ul> : <p className="muted">No marks are missing.</p>}<p className="muted">Missing marks stay blank on reports and are never counted as zero.</p></Card>
      <Card title="Report contents"><p className="muted">Each report shows subject marks, grade and teacher comment, then a class teacher comment and a principal comment. Ranking is off.</p></Card>
    </div>
  </>
}
