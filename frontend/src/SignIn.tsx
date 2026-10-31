import { useState } from 'react'
import type { FormEvent } from 'react'
import { Crest, Logo, Powered, Segmented } from './ui'
import { cachedSchoolName, signInWith } from './auth'
import type { SignInKind } from './auth'

const copy: Record<SignInKind, { placeholder: string; help: string }> = {
  student: { placeholder: 'you@school.ac.ke', help: 'Use the email and password provided by your school.' },
  staff: { placeholder: 'name@school.ac.ke', help: 'Use your school staff account.' },
  parent: { placeholder: 'parent@email.com', help: 'Use the email and password the school office gave you.' },
}
export default function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [kind, setKind] = useState<SignInKind>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const school = cachedSchoolName() || 'Your school'
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try { await signInWith(email, password); setPassword(''); onSignedIn() } catch (x) { setError(x instanceof Error ? x.message : 'Could not sign in.') } finally { setBusy(false) }
  }
  return <div className="signin">
    <section className="signin-brand on-brand">
      <div className="row"><Crest size={56} /><div><h2>{school}</h2><p className="sub">Student, parent and staff portal</p></div></div>
      <div className="signin-hero"><Logo size={20} animated onDark /><p>Lessons, reports and fees in one place.</p></div>
      <Powered />
    </section>
    <section className="signin-form">
      <form onSubmit={submit}>
        <div className="stack" style={{ gap: 6 }}><h1>Sign in</h1><p className="sub">{copy[kind].help}</p></div>
        <Segmented full value={kind} onChange={setKind} options={[{ id: 'student', label: 'Student' }, { id: 'staff', label: 'School staff' }, { id: 'parent', label: 'Parent' }]} />
        <label className="field">Email address<input type="email" autoComplete="username" placeholder={copy[kind].placeholder} value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="field">Password<span className="pw"><input type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" onClick={() => setShow(x => !x)}>{show ? 'Hide' : 'Show'}</button></span></label>
        {error && <p className="bad-text" role="alert">{error}</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="divider" />
        <p className="muted">Need access? Contact the school office.</p>
      </form>
    </section>
  </div>
}
