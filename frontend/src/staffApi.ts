import { api, signIn, signOut } from './supabase'

export type Applicant = { id: string; reference: string; name: string; firstName: string; lastName: string; class: string; curriculum: string; term: string; status: string; statusCode: string; guardian: string; guardianPhone: string; guardianEmail: string; previousSchool: string; previousGrades: string; observation: string; createdAt: string; decision: string; scores: { subject: string; mark: string | null; maximum: string; comment: string }[]; documents: { id: string; type: string; verified: boolean }[] }
export type Payment = { id: string; student: string; reference: string; date: string; amount: string; method: string; status: string; receipt: string; note: string; invoice: string }
export type Enrolment = { id: string; applicantId: string; reference: string; name: string; class: string; curriculum: string; term: string; principalApproved: boolean; reported: boolean; paymentVerified: boolean; complete: boolean; studentCreated: boolean; payment: string | null }
export async function staffRequest<T>(url: string, method = 'GET', data?: unknown): Promise<T> {
  if (url.endsWith('/api/auth/logout/')) { await signOut(); return {} as T }
  return api<T>(url, method === 'POST' ? 'POST' : 'GET', data)
}
export async function staffLogin(username: string, password: string) { await signIn(username, password); try { await staffRequest('/api/staff/session/') } catch (error) { await signOut(); throw error } }
