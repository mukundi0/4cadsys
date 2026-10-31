import type { ReactNode } from 'react'

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'due'
export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) { return <span className={'pill ' + tone}>{children}</span> }
// Maps API/status wording to a pill tone, per the handoff's status table.
export function statusTone(status: string): Tone {
  const s = status.toLowerCase()
  if (/verified|present|approved|submitted|published|enrolled|accepted|complete/.test(s)) return 'ok'
  if (/absent|rejected|declined/.test(s)) return 'bad'
  if (/pending|to do|review|hold|awaiting|progress/.test(s)) return 'warn'
  if (/interview|ready/.test(s)) return 'info'
  return 'neutral'
}

export function Mark({ size = 13, onDark = false }: { size?: number; onDark?: boolean }) {
  return <span className="grid-mark" style={{ ['--s' as string]: size + 'px', ...(onDark ? { ['--mark' as string]: '#fff' } : {}) }} aria-hidden="true"><i /><i className="corner" /><i /><i /></span>
}
export function Logo({ size = 13, animated = false, onDark = false }: { size?: number; animated?: boolean; onDark?: boolean }) {
  const word = 'acadsys'
  return <span className={'logo' + (animated ? ' animated' : '')} aria-label="acadsys">
    <Mark size={size} onDark={onDark} />
    <span className="wordmark" style={{ ['--w' as string]: size * 1.6 + 'px', ...(onDark ? { ['--wc' as string]: '#fff' } : {}) }} aria-hidden="true">{animated ? [...word].map((ch, i) => <span key={i} style={{ animationDelay: 0.7 + i * 0.06 + 's' }}>{ch}</span>) : word}</span>
  </span>
}
export function Powered() { return <span className="powered">Powered by <Mark size={4} /><b>acadsys</b></span> }
export function Crest({ size = 38 }: { size?: number }) { return <span className="crest" style={{ ['--c' as string]: size + 'px' }} aria-hidden="true" /> }

export function Card({ title, label, action, className = '', children }: { title?: string; label?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return <section className={'card ' + className}>{(title || label || action) && <div className="card-head">{title ? <h2>{title}</h2> : <span className="card-label">{label}</span>}{action}</div>}{children}</section>
}
export function Empty({ title, body }: { title: string; body?: string }) { return <div className="empty"><b>{title}</b>{body && <span>{body}</span>}</div> }
export function Notice({ tone = 'bad', onDismiss, children }: { tone?: 'bad' | 'warn' | 'ok' | 'info'; onDismiss?: () => void; children: ReactNode }) {
  return <div className={'notice ' + tone} role={tone === 'bad' ? 'alert' : 'status'}><span>{children}</span>{onDismiss && <button onClick={onDismiss}>Dismiss</button>}</div>
}
export function Progress({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'ok' }) { return <div className={'bar ' + (tone === 'ok' ? 'ok' : '')} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: Math.min(100, Math.max(0, value)) + '%' }} /></div> }
export function Segmented<T extends string>({ value, options, onChange, full = false }: { value: T; options: { id: T; label: string; cls?: string }[]; onChange: (v: T) => void; full?: boolean }) {
  return <div className={'seg' + (full ? ' full' : '')} role="group">{options.map(o => <button key={o.id} type="button" className={o.cls} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}</div>
}
export function Gate({ done, label, children }: { done: boolean; label: string; children?: ReactNode }) {
  return <div className="gate"><span className={'box' + (done ? ' done' : '')} aria-hidden="true">{done ? '✓' : ''}</span><span>{label}</span><span className="muted" style={{ marginLeft: 'auto' }}>{children ?? (done ? 'Complete' : 'Pending')}</span></div>
}
export function PageHead({ eyebrow, title, sub, greet = false, action }: { eyebrow?: string; title: string; sub?: string; greet?: boolean; action?: ReactNode }) {
  return <div className="page-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1 className={greet ? 'greet' : ''}>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>{action}</div>
}
export const money = (value: string | number | null | undefined) => 'KSh ' + Number(value || 0).toLocaleString('en-KE')
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || '?'
export const longDate = (d = new Date()) => new Intl.DateTimeFormat('en-KE', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
