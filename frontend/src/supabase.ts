const projectUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const storageKey = 'school-supabase-session'
type Session = { access_token: string; refresh_token: string; expires_at?: number; user?: { id: string; email?: string } }
export function configured() { return Boolean(projectUrl && anonKey) }
export function session(): Session | null { try { return JSON.parse(localStorage.getItem(storageKey) || 'null') as Session | null } catch { return null } }
function save(value: Session | null) { if (value) localStorage.setItem(storageKey, JSON.stringify(value)); else localStorage.removeItem(storageKey) }
async function auth(path: string, data?: unknown) {
  if (!configured()) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local to connect Supabase.')
  const response = await fetch(`${projectUrl}/auth/v1/${path}`, { method: 'POST', headers: { apikey: anonKey!, 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) })
  const result = await response.json()
  if (!response.ok) throw new Error(result.msg || result.message || result.error_description || 'Authentication failed.')
  return result
}
export async function signIn(email: string, password: string) { if (!email.includes('@')) throw new Error('Supabase sign in uses the email address on your school account.'); const result = await auth('token?grant_type=password', { email, password }); save({ ...result, expires_at: Math.floor(Date.now()/1000)+result.expires_in }); }
export async function signOut() {
  const current=session()
  try { if(current&&configured()) await fetch(`${projectUrl}/auth/v1/logout`,{method:'POST',headers:{apikey:anonKey!,Authorization:`Bearer ${current.access_token}`},signal:AbortSignal.timeout(3000)}) } catch { /* Clear the local session even if the network is unavailable. */ } finally { save(null) }
}
export async function token(): Promise<string> {
  const original=session(); if (!original) throw new Error('Sign in to continue.')
  let current: Session=original
  if (current.expires_at && current.expires_at < Math.floor(Date.now()/1000)+60) { const refreshed=await auth('token?grant_type=refresh_token',{refresh_token:current.refresh_token}); current={...refreshed,expires_at:Math.floor(Date.now()/1000)+refreshed.expires_in}; save(current) }
  return current.access_token
}
export async function api<T>(path: string, method: 'GET'|'POST'='GET', body?: unknown): Promise<T> {
  if (import.meta.env.DEV) { const demo = await import('./demo'); if (demo.demoRole()) return await demo.demoApi(path) as T }
  if (!configured()) throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.local to connect Supabase.')
  const access=await token(); const response=await fetch(`${projectUrl}/functions/v1/school-api?path=${encodeURIComponent(path)}`,{method,headers:{apikey:anonKey!,Authorization:`Bearer ${access}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
  const data=await response.json(); if(!response.ok) { if(response.status===401) await signOut(); throw Object.assign(new Error(data.error||'The request could not be completed.'),{status:response.status}) } return data as T
}
