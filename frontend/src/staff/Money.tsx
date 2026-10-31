import { useState } from 'react'
import type { StaffData, Act } from './StaffPortal'
import { Card, Empty, Gate, Notice, PageHead, Pill, money, statusTone } from '../ui'

export function Enrolments({ data, act, busy }: { data: StaffData; act: Act; busy: boolean }) {
  const [issuing, setIssuing] = useState<string | null>(null)
  const [ok, setOk] = useState('')
  return <>
    <PageHead eyebrow="Admissions" title="Enrolments" sub="An admission number is issued once all three checks are complete." />
    {ok && <Notice tone="ok" onDismiss={() => setOk('')}>{ok}</Notice>}
    {data.enrolments.length ? <div className="grid g-cards">{data.enrolments.map(e => <Card key={e.id}>
      <div className="row between"><div><p className="mono muted">{e.reference}</p><h2>{e.name}</h2><p className="muted">{e.class} · {e.curriculum}</p></div><Pill tone={e.studentCreated ? 'ok' : e.complete ? 'info' : 'warn'}>{e.studentCreated ? 'Enrolled' : e.complete ? 'Ready' : 'In progress'}</Pill></div>
      <div><Gate done={e.principalApproved} label="Principal approval" /><Gate done={e.reported} label="Physical reporting">{!e.reported && <button className="btn secondary sm" disabled={busy} onClick={() => void act(`/api/staff/enrolments/${e.id}/action/`, { action: 'report', reported: true })}>Confirm reported</button>}</Gate><Gate done={e.paymentVerified} label="Initial payment verified">{e.paymentVerified ? 'Complete' : 'Pending in finance'}</Gate></div>
      {e.complete && !e.studentCreated && (issuing === e.id
        ? <form className="stack" onSubmit={async ev => { ev.preventDefault(); const f = new FormData(ev.currentTarget); if (await act(`/api/staff/enrolments/${e.id}/action/`, { action: 'create_student', username: f.get('username'), password: f.get('password'), admissionNumber: f.get('admissionNumber') })) { setOk(`Admission number ${f.get('admissionNumber')} issued. Student login created.`); setIssuing(null) } }}>
          <label className="field">Student email<input name="username" type="email" required /></label><label className="field">Temporary password<input name="password" type="password" required /></label><label className="field">Admission number<input name="admissionNumber" className="mono" required /></label>
          <div className="row"><button className="btn" disabled={busy}>Issue admission number and create login</button><button type="button" className="btn secondary" onClick={() => setIssuing(null)}>Cancel</button></div></form>
        : <button className="btn" onClick={() => setIssuing(e.id)}>Issue admission number and create login</button>)}
    </Card>)}</div> : <Card><Empty title="No enrolments yet" body="Accepted applicants will appear here." /></Card>}
  </>
}

export function Finance({ data, act, busy }: { data: StaffData; act: Act; busy: boolean }) {
  const p = data.payments
  // A reference used by more than one payment is flagged as a possible duplicate.
  const counts = p.reduce<Record<string, number>>((m, x) => { const k = x.reference.trim().toLowerCase(); m[k] = (m[k] ?? 0) + 1; return m }, {})
  const dup = (x: typeof p[number]) => counts[x.reference.trim().toLowerCase()] > 1
  const verified = p.filter(x => x.status === 'verified').reduce((n, x) => n + Number(x.amount), 0)
  return <>
    <PageHead eyebrow="Accounts" title="Finance" sub="Payment records and verification status." />
    <div className="grid g-stat"><Card label="Verified this term"><div className="stat"><span className="v mono">{money(verified)}</span></div></Card><Card label="Awaiting verification"><div className="stat"><span className="v">{p.filter(x => x.status === 'pending').length}</span></div></Card><Card label="Flagged duplicates"><div className="stat"><span className="v bad-text">{p.filter(dup).length}</span></div></Card></div>
    <Card className="flush">{p.length ? <div className="table-wrap"><table style={{ ['--tw' as string]: '960px' }}><thead><tr><th>Student / applicant</th><th>Reference</th><th>Method</th><th>Date</th><th className="right">Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{p.map(x => <tr key={x.id}>
      <th scope="row"><div className="cell"><b>{x.student || 'Unlinked payment'}</b>{dup(x) && <span className="bad-text">Duplicate reference</span>}</div></th><td className="mono">{x.reference}</td><td>{x.method}</td><td className="mono">{new Date(x.date).toLocaleDateString('en-KE')}</td><td className="num">{money(x.amount)}</td><td><Pill tone={statusTone(x.status)}>{x.status}</Pill></td>
      <td>{x.status === 'pending' ? <div className="row"><button className="btn sm" disabled={busy} onClick={() => void act(`/api/staff/finance/${x.id}/verify/`, { decision: 'verified' })}>Verify</button><button className="btn secondary sm" disabled={busy} onClick={() => void act(`/api/staff/finance/${x.id}/verify/`, { decision: 'rejected' })}>Reject</button></div> : <span className="mono muted">{x.receipt}</span>}</td></tr>)}</tbody></table></div>
      : <div style={{ padding: 20 }}><Empty title="No payments yet" body="Payments recorded by the accounts office will appear here." /></div>}</Card>
  </>
}
