import { useState } from 'react'
import type { FormEvent } from 'react'

type StudentLoginProps = {
  email: string
  password: string
  error: string
  busy: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function StudentLogin({ email, password, error, busy, onEmailChange, onPasswordChange, onSubmit }: StudentLoginProps) {
  const [showPassword, setShowPassword] = useState(false)

  return <main className="student-login-screen">
    <section className="student-login-card" aria-labelledby="login-title">
      <div className="student-login-grid">
        <div className="login-visual">
          <img src="/student-login-hero.svg" alt="A hand-drawn classroom desk with books labeled Mathematics, Science, English, History, and Geography" />
          <span className="login-term-badge">Term 3, 2026</span>
        </div>

        <div className="student-login-content">
          <a className="login-brand" href="#home" aria-label="School portal home">
            <span className="login-brand-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.2 12 4l9 5.2v1.6H3V9.2Zm2 3h2v5h2v-5h2v5h2v-5h2v5h2v-5h2v7H5v-7Zm-2 9h18v-1.7H3v1.7Z" fill="currentColor" /></svg></span>
            <span>School portal<span className="login-brand-dot">.</span></span>
          </a>

          <div className="login-heading"><p>STUDENT PORTAL</p><h1 id="login-title">Sign in</h1><span>Enter the email and password provided by your school.</span></div>
          <div className="login-role-switch" aria-label="Choose portal"><span aria-current="page">Student</span><a href="#admin-dashboard">School staff</a></div>

          <form className="student-login-form" onSubmit={onSubmit}>
            <div className="login-field"><label htmlFor="student-email">Email address</label><input id="student-email" type="email" autoComplete="username" placeholder="you@school.com" value={email} onChange={event => onEmailChange(event.target.value)} required /></div>
            <div className="login-field"><label htmlFor="student-password">Password</label><div className="login-password-wrap"><input id="student-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={event => onPasswordChange(event.target.value)} required /><button type="button" className="login-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={showPassword ? 'M2.1 12s3.6-6.5 9.9-6.5S21.9 12 21.9 12s-3.6 6.5-9.9 6.5S2.1 12 2.1 12Zm9.9 3.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z' : 'M3 3 21 21M10.6 5.7c.5-.1.9-.2 1.4-.2 6.3 0 9.9 6.5 9.9 6.5a17.2 17.2 0 0 1-3.2 3.8M6.2 6.2A17.4 17.4 0 0 0 2.1 12s3.6 6.5 9.9 6.5c1.1 0 2.1-.2 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2'} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg></button></div></div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="student-login-submit" type="submit" disabled={busy}>{busy ? <><span className="login-spinner" /> Signing in…</> : 'Sign in'}</button>
          </form>

          <div className="login-help"><span>Need help?</span><p>Contact the school office for account access.</p></div>
          <footer className="login-footer"><span>School portal · 2026</span><a href="#admin-dashboard">Staff sign in</a></footer>
        </div>
      </div>
    </section>
  </main>
}
