import { useEffect, useState } from 'react'

// Minimal history-based router: no dependency, one hook.
const changed = 'acadsys:navigate'
export function navigate(path: string, replace = false) {
  if (path === location.pathname) return
  history[replace ? 'replaceState' : 'pushState'](null, '', path)
  dispatchEvent(new Event(changed))
}
export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const update = () => { setPath(location.pathname); scrollTo(0, 0) }
    addEventListener('popstate', update); addEventListener(changed, update)
    return () => { removeEventListener('popstate', update); removeEventListener(changed, update) }
  }, [])
  return path
}
// Links from before the move to real paths used '#home' and '#admin-dashboard'.
export function migrateLegacyHash() {
  const hash = location.hash.replace('#', '')
  if (!hash) return
  const target = hash.startsWith('admin-') ? '/staff/' + hash.slice(6).replace('dashboard', 'overview') : '/' + hash.replace('home', '')
  history.replaceState(null, '', target)
}
