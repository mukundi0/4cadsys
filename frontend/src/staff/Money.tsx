import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { StaffData, Act } from './StaffPortal'
import { Card, Empty, Gate, Notice, PageHead, Pill, money, statusTone } from '../ui'
import { staffRequest } from '../staffApi'

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
    <FinanceEntryForms />
    <Card className="flush">{p.length ? <div className="table-wrap"><table style={{ ['--tw' as string]: '960px' }}><thead><tr><th>Student / applicant</th><th>Reference</th><th>Method</th><th>Date</th><th className="right">Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{p.map(x => <tr key={x.id}>
      <th scope="row"><div className="cell"><b>{x.student || 'Unlinked payment'}</b>{dup(x) && <span className="bad-text">Duplicate reference</span>}</div></th><td className="mono">{x.reference}</td><td>{x.method}</td><td className="mono">{new Date(x.date).toLocaleDateString('en-KE')}</td><td className="num">{money(x.amount)}</td><td><Pill tone={statusTone(x.status)}>{x.status}</Pill></td>
      <td>{x.status === 'pending' ? <div className="row"><button className="btn sm" disabled={busy} onClick={() => void act(`/api/staff/finance/${x.id}/verify/`, { decision: 'verified' })}>Verify</button><button className="btn secondary sm" disabled={busy} onClick={() => void act(`/api/staff/finance/${x.id}/verify/`, { decision: 'rejected' })}>Reject</button></div> : <span className="mono muted">{x.receipt}</span>}</td></tr>)}</tbody></table></div>
      : <div style={{ padding: 20 }}><Empty title="No payments yet" body="Payments recorded by the accounts office will appear here." /></div>}</Card>
  </>
}

type FinanceChoices={students:{id:string;label:string;term:string}[];applicants:{id:string;label:string;term:string}[]}
type InvoiceChoice={id:string;number:string;student:string;status:string;total:string;paid:string}
function FinanceEntryForms(){
  const [choices,setChoices]=useState<FinanceChoices>({students:[],applicants:[]}),[invoices,setInvoices]=useState<InvoiceChoice[]>([]),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  const load=async()=>{const [c,i]=await Promise.all([staffRequest<FinanceChoices>('/api/staff/finance/choices/'),staffRequest<{invoices:InvoiceChoice[]}>('/api/staff/invoices/')]);setChoices(c);setInvoices(i.invoices)}
  useEffect(()=>{void load().catch(e=>setError(e instanceof Error?e.message:'Could not load finance options.'))},[])
  async function submit(e:FormEvent<HTMLFormElement>,url:string,body:(f:FormData)=>unknown){e.preventDefault();const form=e.currentTarget;setBusy(true);setError('');setMessage('');try{await staffRequest(url,'POST',body(new FormData(form)));setMessage('Saved successfully.');form.reset();await load()}catch(x){setError(x instanceof Error?x.message:'Could not save.')}finally{setBusy(false)}}
  return <><div className="grid g-eq" style={{alignItems:'start'}}>
    <Card title="Create invoice"><form className="stack" onSubmit={e=>void submit(e,'/api/staff/invoices/create/',f=>{const target=String(f.get('target')||'');return{studentId:target.startsWith('s:')?target.slice(2):'',applicantId:target.startsWith('a:')?target.slice(2):'',number:f.get('number'),term:f.get('term'),dueOn:f.get('dueOn')||null,lines:[{description:f.get('description'),amount:Number(f.get('amount'))}]}})}><label className="field">For student or applicant<select name="target" required defaultValue=""><option value="" disabled>Choose account</option><optgroup label="Students">{choices.students.map(x=><option key={x.id} value={'s:'+x.id}>{x.label}</option>)}</optgroup><optgroup label="Applicants">{choices.applicants.map(x=><option key={x.id} value={'a:'+x.id}>{x.label}</option>)}</optgroup></select></label><label className="field">Invoice number<input name="number" required /></label><label className="field">Term<input name="term" required /></label><label className="field">Due date<input name="dueOn" type="date" /></label><label className="field">Charge description<input name="description" required /></label><label className="field">Amount (KSh)<input name="amount" type="number" min="0" step="0.01" required /></label><button className="btn" disabled={busy}>Create invoice</button></form></Card>
    <Card title="Record a payment"><form className="stack" onSubmit={e=>void submit(e,'/api/staff/finance/record-payment/',f=>{const target=String(f.get('target')||'');return{invoiceId:target.startsWith('i:')?target.slice(2):'',reference:f.get('reference'),method:f.get('method'),amount:Number(f.get('amount')),note:f.get('note')}})}><label className="field">Issued invoice<select name="target" required defaultValue=""><option value="" disabled>Choose invoice</option>{invoices.filter(x=>x.status==='issued'&&Number(x.total)>Number(x.paid)).map(x=><option key={x.id} value={'i:'+x.id}>{x.number} · {x.student} · {money(String(Number(x.total)-Number(x.paid)))} due</option>)}</select></label><label className="field">Reference<input name="reference" required /></label><label className="field">Method<select name="method"><option value="cash">Cash</option><option value="mpesa">M-Pesa</option><option value="bank">Bank transfer</option><option value="other">Other</option></select></label><label className="field">Amount (KSh)<input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="field">Note<input name="note" /></label><button className="btn" disabled={busy}>Record for verification</button></form></Card>
  </div>{error&&<Notice>{error}</Notice>}{message&&<Notice tone="ok">{message}</Notice>}</>
}
