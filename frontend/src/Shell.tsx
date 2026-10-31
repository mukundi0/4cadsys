import type { ReactNode } from 'react'
import { Crest, Mark, Powered, initials } from './ui'
import { navigate } from './router'

export type NavItem = { path: string; label: string; count?: number | null }
type Props = {
  portal: 'student' | 'parent' | 'staff'
  portalName: string
  school: string
  user: { name: string; role: string }
  nav: NavItem[]
  tabs?: NavItem[]
  path: string
  term?: string
  switchTo?: { label: string; path: string }
  children: ReactNode
  aside?: ReactNode
  onSignOut: () => void
}
export default function Shell({ portal, portalName, school, user, nav, tabs, path, term, switchTo, children, aside, onSignOut }: Props) {
  const current = nav.find(n => n.path === path) ?? nav[0]
  const items = tabs ?? nav.slice(0, 4)
  return <div className={'shell ' + portal}>
    <aside className="sidebar">
      <div className="school-block"><Crest /><div><b>{school}</b><span>{portalName}</span></div></div>
      {aside}
      <nav className="side-nav" aria-label={portalName}>{nav.map(n => <button key={n.path} aria-current={n.path === path ? 'page' : undefined} onClick={() => navigate(n.path)}>{n.label}{n.count ? <span className="nav-count">{n.count}</span> : null}</button>)}</nav>
      <div className="side-foot"><div className="user-row"><span className="avatar">{initials(user.name)}</span><div style={{ minWidth: 0 }}><b>{user.name}</b><span>{user.role}</span></div></div><Powered /></div>
    </aside>
    <div>
      <header className="topbar">
        <div className="crumbs">{portalName} / <b>{current.label}</b></div>
        {term && <span className="chip hide-m">{term}</span>}
        {switchTo && <a className="hide-m" href={switchTo.path} onClick={e => { e.preventDefault(); navigate(switchTo.path) }}>{switchTo.label}</a>}
        <button className="btn secondary sm" onClick={onSignOut}>Sign out</button>
      </header>
      <main className="content" id="main">{children}</main>
    </div>
    <nav className="tabbar" aria-label="Main" style={{ ['--tabs' as string]: items.length }}>{items.map(n => <button key={n.path} aria-current={n.path === path ? 'page' : undefined} onClick={() => navigate(n.path)}><i />{n.label}</button>)}</nav>
  </div>
}
export { Mark }
