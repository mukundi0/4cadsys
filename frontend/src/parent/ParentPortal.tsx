import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Shell from '../Shell'
import type { NavItem } from '../Shell'
import { Card, Empty, Notice, PageHead, Pill, Segmented, initials, longDate, money, statusTone } from '../ui'
import { navigate } from '../router'
import { loadChildPortal, loadChildren, loadNotifications, markNotificationRead, saveGuardian, sendStkPush, submitProof } from '../parentApi'
import type { Child, ChildPortal, ParentNotification } from '../parentApi'

const nav: NavItem[] = [{ path: '/parent', label: 'Overview' }, { path: '/parent/fees', label: 'Fees and payments' }, { path: '/parent/reports', label: 'Reports' }, { path: '/parent/attendance', label: 'Attendance' }, { path: '/parent/notices', label: 'Notices' }, { path: '/parent/details', label: 'My details' }]
const tabs: NavItem[] = [{ path: '/parent', label: 'Home' }, { path: '/parent/fees', label: 'Fees' }, { path: '/parent/reports', label: 'Reports' }, { path: '/parent/details', label: 'More' }]
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })

// Totals the statement the API returns: payments count only once verified.
function feeTotals(fees: ChildPortal['fees']) {
  const rows = fees?.statement ?? []
  const charges = rows.reduce((n, r) => n + Number(r.charge), 0)
  const verified = rows.filter(r => r.status === 'verified').reduce((n, r) => n + Number(r.payment), 0)
  const pending = rows.filter(r => r.status === 'pending').reduce((n, r) => n + Number(r.payment), 0)
  return { charges, verified, pending, balance: Number(fees?.balance ?? charges - verified) }
}

export default function ParentPortal({ school, path, onSignOut }: { school: string; path: string; onSignOut: () => void }) {
  const [children, setChildren] = useState<Child[] | null>(null)
  const [childId, setChildId] = useState('')
  const [portal, setPortal] = useState<ChildPortal | null>(null)
  const [notes, setNotes] = useState<ParentNotification[]>([])
  const [error, setError] = useState('')
  useEffect(() => { Promise.all([loadChildren(), loadNotifications().catch(() => [])]).then(([c, n]) => { setChildren(c); setNotes(n); setChildId(id => id || c[0]?.id || '') }).catch(e => setError(e instanceof Error ? e.message : 'Could not load your children.')) }, [])
  const reload = useCallback(() => { if (!childId) return; setPortal(null); loadChildPortal(childId).then(setPortal).catch(e => setError(e instanceof Error ? e.message : 'Could not load this child.')) }, [childId])
  useEffect(() => reload(), [reload])
  const child = children?.find(c => c.id === childId)
  const page = nav.find(n => n.path === path) ? path : '/parent'
  const first = (child?.name ?? '').split(' ')[0]
  const aside = children && children.length > 0 && <div><p className="children-label">YOUR CHILDREN</p>{children.map(c => <button key={c.id} className="child-row" aria-pressed={c.id === childId} onClick={() => setChildId(c.id)}><span className="avatar">{initials(c.name)}</span><span><b>{c.name.split(' ')[0]}</b><span>{c.class}</span></span></button>)}</div>
  const unread = notes.filter(n => !n.read).length
  const navItems = nav.map(n => n.path === '/parent/notices' ? { ...n, count: unread } : n)
  return <Shell portal="parent" portalName="Parent portal" school={school} user={{ name: 'Parent', role: 'Guardian' }} nav={navItems} tabs={tabs} path={page} aside={aside} onSignOut={onSignOut}>
    {error && <Notice onDismiss={() => setError('')}>{error}</Notice>}
    {children && !children.length && <Card><Empty title="No children linked yet" body="Ask the school office to link your children to your account." /></Card>}
    {child && page === '/parent/details' ? <Details /> : child && !portal ? <p className="muted" role="status">Loading {first}…</p> : child && portal && <>
      {page === '/parent' && <Overview child={child} portal={portal} notes={notes} />}
      {page === '/parent/fees' && <Fees child={child} portal={portal} onChanged={reload} />}
      {page === '/parent/reports' && <Reports child={child} portal={portal} />}
      {page === '/parent/attendance' && <Attendance child={child} />}
      {page === '/parent/notices' && <Notices notes={notes} onRead={id => { setNotes(ns => ns.map(n => n.id === id ? { ...n, read: true } : n)); void markNotificationRead(id) }} />}
    </>}
  </Shell>
}

function Overview({ child, portal, notes }: { child: Child; portal: ChildPortal; notes: ParentNotification[] }) {
  const first = child.name.split(' ')[0], t = feeTotals(portal.fees), upcoming = [...portal.assignments].filter(a => a.due).sort((a, b) => a.due!.localeCompare(b.due!)).slice(0, 4)
  const report = portal.reports?.[0], note = notes[0]
  return <>
    <PageHead greet eyebrow={longDate()} title="Hello" sub={`How ${first} is doing this term · ${child.class}`} />
    <div className="grid g-3">
      <button className="card clickable" onClick={() => navigate('/parent/attendance')}><span className="card-label">Attendance</span><Empty title="Not shared yet" body="Daily attendance will appear here." /></button>
      {portal.fees ? <section className="card highlight"><span className="card-label">Fees balance</span><div className="stat"><span className="v mono">{money(t.balance)}</span></div><span className="sub">{t.pending ? `${money(t.pending)} pending verification` : t.balance <= 0 ? 'Fully paid for this term' : 'Pay by M-Pesa or upload proof'}</span><div><button className="btn btn-light" onClick={() => navigate('/parent/fees')}>Pay or upload proof →</button></div></section> : <Card label="Fees balance"><Empty title="Fees are hidden" body="The school has not given you finance access for this child." /></Card>}
      <button className="card clickable" onClick={() => navigate('/parent/reports')}><span className="card-label">Latest report</span>{report ? <><h3>{report.title}</h3><div><Pill tone={statusTone(report.status)}>{report.status}</Pill></div></> : <Empty title="No reports yet" body="Approved reports will appear here." />}</button>
    </div>
    <div className="grid g-eq">
      <Card title={`Coming up for ${first}`}>{upcoming.length ? upcoming.map(a => <div className="row" key={a.id}><span className="mono muted" style={{ width: 56 }}>{shortDate(a.due!)}</span><div><b>{a.title}</b><p className="muted">{a.subject}</p></div></div>) : <Empty title="Nothing due right now" body="New work from teachers will appear here." />}</Card>
      <Card label="Latest notice" action={<button className="link" onClick={() => navigate('/parent/notices')}>All notices</button>}>{note ? <><span className="mono muted">{shortDate(note.createdAt)}</span><h3>{note.title}</h3><p className="muted">{note.body}</p></> : <Empty title="No notices" body="Messages from the school will appear here." />}</Card>
    </div>
  </>
}

const toMsisdn = (v: string) => { const d = v.replace(/\D/g, ''); return d.startsWith('0') ? '254' + d.slice(1) : d }
const readFile = (f: File) => new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => no(new Error('Could not read the file.')); r.readAsDataURL(f) })

function Fees({ child, portal, onChanged }: { child: Child; portal: ChildPortal; onChanged: () => void }) {
  const t = feeTotals(portal.fees), invoice = portal.fees?.invoices.find(i => i.status === 'issued')
  const [tab, setTab] = useState<'mpesa' | 'proof'>('mpesa')
  const [phone, setPhone] = useState(''), [amount, setAmount] = useState(String(Math.max(0, t.balance))), [ref, setRef] = useState('')
  const [file, setFile] = useState<File | null>(null), [method, setMethod] = useState<'mpesa' | 'bank'>('mpesa'), [sheet, setSheet] = useState(''), [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [err, setErr] = useState('')
  const statement = useMemo(() => [...(portal.fees?.statement ?? [])].reverse(), [portal.fees])
  if (!portal.fees) return <><PageHead eyebrow="Parent portal" title="Fees and payments" /><Card><Empty title="Fees are hidden" body="The school has not given you finance access for this child." /></Card></>
  async function submit(e: FormEvent) {
    e.preventDefault(); if (!invoice) return; setBusy(true); setErr(''); setMsg('')
    try {
      if (tab === 'mpesa') { await sendStkPush(invoice.id, toMsisdn(phone), Number(amount)); setSheet(`We sent an M-Pesa prompt to ${phone}. Enter your PIN to pay ${money(amount)}. The payment shows as pending until the accounts office verifies it.`) }
      else { await submitProof(child.id, invoice.id, { transactionReference: ref, amount: Number(amount), method, ...(file ? { fileBase64: await readFile(file), fileName: file.name } : {}) }); setMsg('Proof received. The accounts office will verify it, and the payment shows as pending until then.'); setRef(''); setFile(null) }
      onChanged()
    } catch (x) { setErr(x instanceof Error ? x.message : 'Could not complete the payment.') } finally { setBusy(false) }
  }
  return <>
    {sheet && <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label="Check your phone"><div className="sheet"><span className="grab" /><div className="row"><i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--amber)' }} /><h2>Check your phone</h2></div><p>{sheet}</p><button className="btn" style={{ background: 'var(--ink)', borderColor: 'var(--ink)' }} onClick={() => setSheet('')}>Done</button></div></div>}
    <PageHead eyebrow="Parent portal" title="Fees and payments" sub={`${child.name} · ${portal.student.term}`} />
    <div className="grid g-stat"><Card label="Total charges"><div className="stat"><span className="v mono">{money(t.charges)}</span></div></Card><Card label="Verified payments"><div className="stat"><span className="v mono">{money(t.verified)}</span></div></Card><section className="card highlight"><span className="card-label">Balance</span><div className="stat"><span className="v mono">{money(t.balance)}</span></div></section></div>
    <div className="grid g-eq" style={{ alignItems: 'start' }}>
      <Card title="Make a payment">
        {invoice ? <form className="stack" onSubmit={submit}>
          <Segmented full value={tab} onChange={setTab} options={[{ id: 'mpesa', label: 'M-Pesa' }, { id: 'proof', label: 'Upload proof' }]} />
          {tab === 'mpesa' ? <label className="field">M-Pesa phone number<input className="mono" inputMode="tel" placeholder="0722 000 000" value={phone} onChange={e => setPhone(e.target.value)} required /></label>
            : <><label className="field">Transaction reference<input className="mono" value={ref} onChange={e => setRef(e.target.value)} required /></label>
              <Segmented full value={method} onChange={setMethod} options={[{ id: 'mpesa', label: 'Paid by M-Pesa' }, { id: 'bank', label: 'Paid by bank' }]} />
              <label className="field">{method === 'bank' ? 'Bank slip (required)' : 'M-Pesa message screenshot (optional)'} · PDF, JPEG or PNG<input required={method === 'bank'} type="file" accept="application/pdf,image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label></>}
          <label className="field">Amount (KSh)<input className="mono" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ''))} required /></label>
          <div className="row wrap">{[5000, 10000].filter(n => n < t.balance).map(n => <button type="button" key={n} className="btn secondary sm mono" onClick={() => setAmount(String(n))}>{n.toLocaleString('en-KE')}</button>)}<button type="button" className="btn secondary sm mono" onClick={() => setAmount(String(Math.max(0, t.balance)))}>Full balance</button></div>
          {err && <Notice>{err}</Notice>}{msg && <Notice tone="warn">{msg}</Notice>}
          <button className="btn" disabled={busy || !Number(amount)}>{busy ? 'Sending…' : tab === 'mpesa' ? 'Send M-Pesa prompt' : 'Submit proof'}</button>
        </form> : <Empty title="Nothing to pay" body="There is no open invoice for this term." />}
      </Card>
      <Card title="Statement">{statement.length ? <div>{statement.map((x, i) => { const pay = x.payment !== '0'; return <div key={i} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--rule-soft)' }}>
          <div className="cell"><b>{x.description}</b><span className="mono">{x.date || '—'}{x.receipt ? ' · ' + x.receipt : ''}</span></div>
          <div className="cell right"><b className="mono">{pay ? '− ' + money(x.payment) : money(x.charge)}</b>{x.status && <Pill tone={statusTone(x.status)}>{x.status}</Pill>}</div></div> })}</div> : <Empty title="No invoices or payments" body="Nothing has been recorded for this term." />}</Card>
    </div>
  </>
}

function Reports({ child, portal }: { child: Child; portal: ChildPortal }) {
  return <>
    <PageHead eyebrow="Parent portal" title="Reports" sub={child.name} />
    {!child.canViewReports ? <Card><Empty title="Reports are hidden" body="The school has not given you report access for this child." /></Card>
      : portal.reports?.length ? portal.reports.map(r => <Card key={r.id}><div className="row between wrap"><div><h2>{r.title}</h2><p className="muted">{r.term}</p></div><Pill tone={statusTone(r.status)}>{r.status}</Pill></div></Card>)
      : <Card><Empty title="No reports yet" body="No approved reports have been published yet." /></Card>}
  </>
}
function Attendance({ child }: { child: Child }) {
  return <><PageHead eyebrow="Parent portal" title="Attendance" sub={child.name} /><Card><Empty title="Attendance is not shared yet" body="To explain an absence, send a note to the class teacher. Staff verify absences before they count towards attendance alerts." /></Card></>
}
function Notices({ notes, onRead }: { notes: ParentNotification[]; onRead: (id: string) => void }) {
  return <><PageHead eyebrow="Parent portal" title="Notices" />
    <div className="stack" style={{ maxWidth: 760 }}>{notes.length ? notes.map(n => <Card key={n.id}><div className="row between"><Pill tone="info">{n.student}</Pill><span className="mono muted">{shortDate(n.createdAt)}</span></div><h3>{n.title}</h3><p>{n.body}</p>{!n.read && <div><button className="link plain" onClick={() => onRead(n.id)}>Mark as read</button></div>}</Card>) : <Card><Empty title="No notices" body="Messages from the school will appear here." /></Card>}</div></>
}
function Details() {
  const [form, setForm] = useState({ phone: '', email: '' }), [saved, setSaved] = useState(false), [err, setErr] = useState('')
  async function save(e: FormEvent) { e.preventDefault(); setErr(''); setSaved(false); try { await saveGuardian({ ...(form.phone && { phone: form.phone }), ...(form.email && { email: form.email }) }); setSaved(true) } catch (x) { setErr(x instanceof Error ? x.message : 'Could not save.') } }
  return <><PageHead eyebrow="Parent portal" title="My details" />
    <Card className="" ><form className="stack" style={{ maxWidth: 480 }} onSubmit={save}>
      <label className="field">Phone<input className="mono" inputMode="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
      <label className="field">Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><span className="muted" style={{ fontWeight: 400 }}>Leave blank to keep your current email. Changing it changes the email you sign in with.</span></label>
      {err && <Notice>{err}</Notice>}
      <div className="row"><button className="btn" disabled={!form.phone && !form.email}>Save changes</button>{saved && <span className="ok-text" role="status">Saved</span>}</div>
      <p className="muted">To change who can see your children’s records, contact the school office.</p>
    </form></Card></>
}
