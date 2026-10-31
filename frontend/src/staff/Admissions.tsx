import { useState } from 'react'
import type { StaffData, Act } from './StaffPortal'
import { Card, Empty, PageHead, Pill, Progress, initials, statusTone } from '../ui'

const fields: [string, string][] = [['firstName', 'First name'], ['lastName', 'Last name'], ['guardianName', 'Guardian name'], ['guardianPhone', 'Guardian phone'], ['guardianEmail', 'Guardian email'], ['class', 'Intended class'], ['curriculum', 'Curriculum'], ['term', 'Intended term'], ['previousSchool', 'Previous school']]
const required = ['firstName', 'lastName', 'guardianName', 'guardianPhone', 'class', 'curriculum', 'term']

export default function Admissions({ data, act, busy }: { data: StaffData; act: Act; busy: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [note, setNote] = useState('')
  const [done, setDone] = useState('')
  const list = data.applicants, a = list.find(x => x.id === selected) ?? list[0]
  async function decide(decision: 'accepted' | 'hold' | 'declined') { if (a && await act(`/api/staff/admissions/${a.id}/action/`, { action: 'decision', decision, note })) { setDone(`${decision === 'hold' ? 'Put on hold' : decision === 'accepted' ? 'Accepted' : 'Declined'} · just now`); setNote('') } }
  async function contact() { const summary = prompt('What was discussed with the guardian?'); if (a && summary?.trim()) await act(`/api/staff/admissions/${a.id}/action/`, { action: 'contact', summary }) }
  return <>
    <PageHead eyebrow="Student intake" title="Admissions" sub="Applications from the school database." action={<button className="btn" onClick={() => setCreating(x => !x)}>{creating ? 'Close form' : 'New application'}</button>} />
    {creating && <Card title="New applicant"><form className="stack" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); if (await act('/api/staff/admissions/create/', Object.fromEntries(f))) setCreating(false) }}>
      <div className="facts">{fields.map(([k, l]) => <label className="field" key={k}>{l}<input name={k} required={required.includes(k)} /></label>)}</div><div><button className="btn" disabled={busy}>Save application</button></div></form></Card>}
    <div className="split" style={{ gridTemplateColumns: 'minmax(240px,320px) minmax(0,1fr)' }}>
      <Card title={`${list.length} applications`}>{list.length ? <div className="stack" style={{ gap: 4 }}>{list.map(x => <button key={x.id} className="list-row" aria-pressed={x.id === a?.id} onClick={() => { setSelected(x.id); setDone('') }}><span className="row"><span className="avatar">{initials(x.name)}</span><span style={{ flex: 1, minWidth: 0 }}><b>{x.name}</b><br /><span className="mono muted" style={{ fontSize: 12 }}>{x.reference} · {x.class}</span></span></span><span><Pill tone={statusTone(x.status)}>{x.status}</Pill></span></button>)}</div> : <Empty title="No applications yet" body="New applications will appear here." />}</Card>
      {a ? <Card>
        <div className="row between wrap"><div><p className="mono muted">{a.reference}</p><h2 style={{ fontSize: 26, letterSpacing: '-.02em' }}>{a.name}</h2><p className="muted">{a.class} · {a.curriculum} · {a.term}</p></div><Pill tone={statusTone(a.status)}>{a.status}</Pill></div>
        <dl className="facts"><div><dt>Guardian</dt><dd>{a.guardian}</dd></div><div><dt>Phone</dt><dd className="mono">{a.guardianPhone}</dd></div><div><dt>Previous school</dt><dd>{a.previousSchool || '—'}</dd></div></dl>
        <div><h3>Interview scores</h3>{a.scores.length ? a.scores.map(s => <div className="row" key={s.subject} style={{ padding: '8px 0' }}><span style={{ width: 90 }}>{s.subject}</span><div style={{ flex: 1 }}><Progress value={s.mark === null ? 0 : Number(s.mark) / Number(s.maximum) * 100} /></div><span className="mono">{s.mark ?? '—'} / {s.maximum}</span></div>) : <p className="muted">No interview scores recorded.</p>}</div>
        <div><h3>Documents</h3><div className="row wrap" style={{ paddingTop: 8 }}>{a.documents.length ? a.documents.map(d => <span className="row" key={d.id} style={{ gap: 8, border: '1px solid var(--rule)', borderRadius: 8, padding: '6px 10px' }}>{d.type}<Pill tone={d.verified ? 'ok' : 'warn'}>{d.verified ? 'Verified' : 'Awaiting review'}</Pill></span>) : <p className="muted">No documents uploaded.</p>}</div></div>
        <label className="field">Decision note<textarea rows={3} value={note} onChange={e => setNote(e.target.value)} /></label>
        <div className="row wrap"><button className="btn" disabled={busy} onClick={() => void decide('accepted')}>Accept</button><button className="btn secondary" disabled={busy} onClick={() => void decide('hold')}>Hold</button><button className="btn danger" disabled={busy} onClick={() => void decide('declined')}>Decline</button><button className="link" style={{ marginLeft: 'auto' }} onClick={() => void contact()}>Log guardian contact</button></div>
        <p className="muted">{done || 'Admission decisions require principal access. The guardian is contacted after the decision.'}</p>
      </Card> : <Card><Empty title="No application selected" body="Choose one from the list." /></Card>}
    </div>
  </>
}
