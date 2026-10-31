import { api } from './supabase'
import type { StudentPortal } from './studentApi'

export type Child = { id: string; name: string; admissionNumber: string; class: string; stream: string; canViewFinances: boolean; canViewReports: boolean }
export type ParentNotification = { id: string; student: string; title: string; body: string; createdAt: string; read: boolean }
export type ChildInvoice = { id: string; number: string; term: string; status: string; dueOn: string | null; total: string }
export type ChildPortal = {
  student: { name: string; admissionNumber: string; class: string; term: string }
  assignments: { id: string; title: string; subject: string; due: string | null }[]
  timetable: { weekday: number; start: string; end: string; subject: string; teacher: string; room: string }[]
  reports?: { id: string; title: string; term: string; status: string }[]
  fees?: { balance: string; statement: StudentPortal['fees']['statement']; invoices: ChildInvoice[] }
}

export const loadChildren = () => api<{ children: Child[] }>('/api/parent/children/').then(x => x.children)
export const loadChildPortal = (id: string) => api<ChildPortal>(`/api/parent/children/${id}/portal/`)
export const loadNotifications = () => api<{ notifications: ParentNotification[] }>('/api/parent/notifications/').then(x => x.notifications)
export const markNotificationRead = (id: string) => api(`/api/parent/notifications/${id}/read/`, 'POST', {})
export const saveGuardian = (data: { firstName?: string; lastName?: string; phone: string; email: string }) => api<{ name: string; email: string; phone: string }>('/api/parent/profile/', 'POST', data)
export const sendStkPush = (invoiceId: string, phone: string, amount: number) => api(`/api/parent/invoices/${invoiceId}/stk-push/`, 'POST', { phone, amount })
export const submitProof = (childId: string, invoiceId: string, data: { transactionReference: string; amount: number; method: 'mpesa' | 'bank'; fileBase64?: string; fileName?: string }) => api(`/api/parent/children/${childId}/invoices/${invoiceId}/proof/`, 'POST', data)
